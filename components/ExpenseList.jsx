'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Filter, Download, Eye, CreditCard as Edit2, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ExpenseList() {
  const { isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses based on search and category
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.voucher_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || expense.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  // Get unique categories for filter
  const categories = [...new Set(expenses.map(expense => expense.category).filter(Boolean))];

  const exportToCSV = () => {
    const headers = [
      'Date', 'Voucher No', 'Category', 'Vendor Name', 'Particulars',
      'Payment Mode', 'Invoice Amount', 'GST %', 'GST Amount',
      'TDS Deducted', 'Net Payment', 'Payment Date', 'Remarks'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(expense => [
        expense.date,
        expense.voucher_no,
        expense.category,
        expense.vendor_name,
        `"${expense.particulars}"`,
        expense.payment_mode,
        expense.invoice_amount,
        expense.gst_percentage,
        expense.gst_amount,
        expense.tds_deducted,
        expense.net_payment,
        expense.payment_date,
        `"${expense.remarks || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewExpense = (expense) => {
    if (expandedRow === expense.id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(expense.id);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense({
      ...expense,
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      payment_date: expense.payment_date ? format(new Date(expense.payment_date), 'yyyy-MM-dd') : '',
    });
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingExpense,
          invoice_amount: parseFloat(editingExpense.invoice_amount),
          gst_percentage: parseFloat(editingExpense.gst_percentage),
          gst_amount: parseFloat(editingExpense.gst_amount),
          tds_deducted: parseFloat(editingExpense.tds_deducted),
          net_payment: parseFloat(editingExpense.net_payment),
        }),
      });

      if (response.ok) {
        toast.success('Expense updated successfully!');
        setShowEditModal(false);
        setEditingExpense(null);
        fetchExpenses();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update expense');
      }
    } catch (error) {
      toast.error('Failed to update expense');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (expense) => {
    setDeleteExpense(expense);
    setDeleteConfirmation('');
    setShowDeleteModal(true);
  };

  const handleDeleteExpense = async () => {
    if (deleteConfirmation !== deleteExpense.voucher_no) {
      toast.error('Voucher number does not match');
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/expenses/${deleteExpense.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Expense deleted successfully!');
        setShowDeleteModal(false);
        setDeleteExpense(null);
        setDeleteConfirmation('');
        fetchExpenses();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete expense');
      }
    } catch (error) {
      toast.error('Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  // Auto-calculate GST amount and net payment in edit form
  const calculateAmounts = (invoiceAmount, gstPercentage, tdsDeducted) => {
    const gstAmount = (invoiceAmount * gstPercentage) / 100;
    const totalAmount = parseFloat(invoiceAmount) + gstAmount;
    const netPayment = totalAmount - parseFloat(tdsDeducted);
    return { gstAmount, netPayment };
  };

  const handleEditFieldChange = (field, value) => {
    const updatedExpense = { ...editingExpense, [field]: value };

    if (field === 'invoice_amount' || field === 'gst_percentage' || field === 'tds_deducted') {
      const { gstAmount, netPayment } = calculateAmounts(
        updatedExpense.invoice_amount || 0,
        updatedExpense.gst_percentage || 0,
        updatedExpense.tds_deducted || 0
      );
      updatedExpense.gst_amount = gstAmount.toFixed(2);
      updatedExpense.net_payment = netPayment.toFixed(2);
    }

    setEditingExpense(updatedExpense);
  };

  const categories_list = [
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Expenses</h2>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by vendor, particulars, or voucher number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voucher No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Payment
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExpenses.map((expense, index) => (
                <>
                  <tr key={expense.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {expense.voucher_no}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{expense.vendor_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expense.payment_mode === 'UPI'
                          ? 'bg-green-100 text-green-800'
                          : expense.payment_mode === 'Bank Transfer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {expense.payment_mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      ₹{parseFloat(expense.net_payment || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewExpense(expense)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {expandedRow === expense.id ? <ChevronUp className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEditExpense(expense)}
                          disabled={!isAdmin}
                          className={`${isAdmin ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
                          disabled={!isAdmin}
                          className={`${isAdmin ? 'text-red-600 hover:text-red-900' : 'text-gray-400 cursor-not-allowed'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row Details */}
                  {expandedRow === expense.id && (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Particulars:</span>
                            <p className="text-gray-900 mt-1">{expense.particulars}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Invoice Amount:</span>
                            <p className="text-gray-900 mt-1">₹{parseFloat(expense.invoice_amount || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">GST:</span>
                            <p className="text-gray-900 mt-1">{expense.gst_percentage}% (₹{parseFloat(expense.gst_amount || 0).toLocaleString()})</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">TDS Deducted:</span>
                            <p className="text-gray-900 mt-1">₹{parseFloat(expense.tds_deducted || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Payment Date:</span>
                            <p className="text-gray-900 mt-1">
                              {expense.payment_date ? format(new Date(expense.payment_date), 'MMM dd, yyyy') : 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Remarks:</span>
                            <p className="text-gray-900 mt-1">{expense.remarks || 'No remarks'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{startIndex + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredExpenses.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredExpenses.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Expense</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-6 space-y-6">
              {/* Row 1: Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => handleEditFieldChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voucher No. *</label>
                  <input
                    type="text"
                    value={editingExpense.voucher_no}
                    onChange={(e) => handleEditFieldChange('voucher_no', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => handleEditFieldChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories_list.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Particulars and Vendor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Particulars *</label>
                  <textarea
                    rows={3}
                    value={editingExpense.particulars}
                    onChange={(e) => handleEditFieldChange('particulars', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                    <input
                      type="text"
                      value={editingExpense.vendor_name}
                      onChange={(e) => handleEditFieldChange('vendor_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
                    <select
                      value={editingExpense.payment_mode}
                      onChange={(e) => handleEditFieldChange('payment_mode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {paymentModes.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Financial Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Financial Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingExpense.invoice_amount}
                      onChange={(e) => handleEditFieldChange('invoice_amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingExpense.gst_percentage}
                      onChange={(e) => handleEditFieldChange('gst_percentage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingExpense.gst_amount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TDS Deducted (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingExpense.tds_deducted}
                      onChange={(e) => handleEditFieldChange('tds_deducted', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Net Payment (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingExpense.net_payment}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={editingExpense.payment_date}
                    onChange={(e) => handleEditFieldChange('payment_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                  <input
                    type="text"
                    value={editingExpense.remarks || ''}
                    onChange={(e) => handleEditFieldChange('remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Expense'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Voucher No:</strong> {deleteExpense.voucher_no}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Vendor:</strong> {deleteExpense.vendor_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Amount:</strong> ₹{parseFloat(deleteExpense.net_payment || 0).toLocaleString()}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type the voucher number <strong>{deleteExpense.voucher_no}</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder={deleteExpense.voucher_no}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteExpense(null);
                    setDeleteConfirmation('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
                  disabled={deleting || deleteConfirmation !== deleteExpense.voucher_no}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Expense'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}