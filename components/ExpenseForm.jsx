'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Save, Calculator, Upload, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ExpenseForm({ onExpenseAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      gst_percentage: 0,
      tds_deducted: 0,
      voucher_no: '',
    }
  });

  const invoiceAmount = watch('invoice_amount') || 0;
  const gstPercentage = watch('gst_percentage') || 0;
  const tdsDeducted = watch('tds_deducted') || 0;

  // Auto-calculate GST amount and net payment
  const gstAmount = (invoiceAmount * gstPercentage) / 100;
  const totalAmount = parseFloat(invoiceAmount) + gstAmount;
  const netPayment = totalAmount - parseFloat(tdsDeducted);


  // Update calculated fields
  // useState(() => {
  //   setValue('gst_amount', gstAmount.toFixed(2));
  //   setValue('net_payment', netPayment.toFixed(2));
  // }, [invoiceAmount, gstPercentage, tdsDeducted]);

  // ✅ FIX: useEffect so fields update when inputs change
  useEffect(() => {
    setValue('gst_amount', gstAmount.toFixed(2));
    setValue('net_payment', netPayment.toFixed(2));
  }, [invoiceAmount, gstPercentage, tdsDeducted, setValue, gstAmount, netPayment]);

  // Auto-generate voucher number on component mount
  useEffect(() => {
    generateVoucherNumber();
  }, []);

  const generateVoucherNumber = async () => {
    try {
      const response = await fetch('/api/expenses?action=latest-voucher');
      if (response.ok) {
        const data = await response.json();
        const nextVoucherNo = generateNextVoucherNumber(data.latestVoucher);
        setValue('voucher_no', nextVoucherNo);
      }
    } catch (error) {
      console.error('Error generating voucher number:', error);
      // Fallback to default format
      const currentYear = new Date().getFullYear();
      setValue('voucher_no', `EXP/${currentYear}/0001`);
    }
  };

  const generateNextVoucherNumber = (latestVoucher) => {
    const currentYear = new Date().getFullYear();

    if (!latestVoucher) {
      return `EXP/${currentYear}/0001`;
    }

    // Parse the latest voucher number (format: EXP/YYYY/NNNN)
    const match = latestVoucher.match(/^EXP\/(\d{4})\/(\d+)$/);

    if (!match) {
      return `EXP/${currentYear}/0001`;
    }

    const [, year, number] = match;
    const voucherYear = parseInt(year);
    const voucherNumber = parseInt(number);

    // If it's a new year, start from 0001
    if (currentYear > voucherYear) {
      return `EXP/${currentYear}/0001`;
    }

    // Otherwise, increment the number
    const nextNumber = (voucherNumber + 1).toString().padStart(4, '0');
    return `EXP/${currentYear}/${nextNumber}`;
  };

  const categories = [
    'Compliance & Paperwork',
    'Professional Services',
    'Office Supplies',
    'Technology',
    'Marketing',
    'Travel & Transportation',
    'Utilities',
    'Legal Services',
    'Consulting',
    'Other'
  ];

  const paymentModes = [
    'UPI',
    'Bank Transfer',
    'Cash',
    'Cheque',
    'Credit Card',
    'Debit Card'
  ];

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadPromises = files.map(async (file) => {
      try {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File type ${file.type} not allowed. Please upload PDF, JPEG, or PNG files.`);
          return null;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
          return null;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `expense-attachments/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('erp-expense-documents')
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('expense-documents')
          .getPublicUrl(filePath);

        return {
          name: file.name,
          path: filePath,
          url: publicUrl,
          type: file.type,
          size: file.size
        };
      } catch (error) {
        console.error('File upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(result => result !== null);

    setUploadedFiles(prev => [...prev, ...successfulUploads]);
    setUploading(false);

    if (successfulUploads.length > 0) {
      toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
    }

    // Clear the input
    event.target.value = '';
  };

  const removeFile = async (fileToRemove) => {
    try {
      // Remove from Supabase Storage
      const { error } = await supabase.storage
        .from('erp-expense-documents')
        .remove([fileToRemove.path]);

      if (error) {
        console.error('Error removing file:', error);
        toast.error('Failed to remove file from storage');
        return;
      }

      // Remove from local state
      setUploadedFiles(prev => prev.filter(file => file.path !== fileToRemove.path));
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          invoice_amount: parseFloat(data.invoice_amount),
          gst_percentage: parseFloat(data.gst_percentage),
          gst_amount: parseFloat(data.gst_amount),
          tds_deducted: parseFloat(data.tds_deducted),
          net_payment: parseFloat(data.net_payment),
          attachments: uploadedFiles,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      setSubmitMessage('Expense added successfully!');
      setUploadedFiles([]);
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        gst_percentage: 0,
        tds_deducted: 0,
        voucher_no: '',
      });

      // Generate new voucher number for next entry
      generateVoucherNumber();

      if (onExpenseAdded) onExpenseAdded();
    } catch (error) {
      console.error('Error adding expense:', error);
      setSubmitMessage('Error adding expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Save className="h-5 w-5 mr-2 text-blue-600" />
            Add New Expense
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Row 1: Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voucher No. *
              </label>
              <div className="flex items-stretch">
                <input
                  type="text"
                  placeholder="EXP/2025/0001"
                  {...register('voucher_no', { required: 'Voucher number is required' })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
                />
                <button
                  type="button"
                  onClick={generateVoucherNumber}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200 transition-colors flex-shrink-0"
                  title="Generate next voucher number"
                >
                  Auto
                </button>
              </div>
              {errors.voucher_no && (
                <p className="text-red-500 text-sm mt-1">{errors.voucher_no.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Particulars and Vendor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Particulars/Narration *
              </label>
              <textarea
                rows={3}
                placeholder="Describe the expense details..."
                {...register('particulars', { required: 'Particulars are required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.particulars && (
                <p className="text-red-500 text-sm mt-1">{errors.particulars.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Party Name *
                </label>
                <input
                  type="text"
                  placeholder="AR JK & CO."
                  {...register('vendor_name', { required: 'Vendor name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.vendor_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.vendor_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode *
                </label>
                <select
                  {...register('payment_mode', { required: 'Payment mode is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select payment mode</option>
                  {paymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
                {errors.payment_mode && (
                  <p className="text-red-500 text-sm mt-1">{errors.payment_mode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Financial Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Financial Calculations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="1490.00"
                  {...register('invoice_amount', {
                    required: 'Invoice amount is required',
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.invoice_amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.invoice_amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('gst_percentage')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('gst_amount')}
                  value={gstAmount.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TDS Deducted (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('tds_deducted')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Net Payment (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('net_payment')}
                  value={netPayment.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-800 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <input
                type="date"
                {...register('payment_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <input
                type="text"
                placeholder="Additional notes..."
                {...register('remarks')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Attachments (Invoice, Payment Memo, etc.)
            </h3>

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPEG, PNG up to 5MB each
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {submitMessage && (
                <p className={`text-sm ${submitMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {submitMessage}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}