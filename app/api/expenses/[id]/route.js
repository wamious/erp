import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const EXPENSES_TABLE = 'erp_expenses';

// Update expense (admin only)
export async function PUT(request, { params }) {
    try {
        const expenseData = await request.json();
        const { id: userId } = await params;
        const expenseId = userId;


        // Update the expense
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .update({
                date: expenseData.date,
                voucher_no: expenseData.voucher_no,
                category: expenseData.category,
                particulars: expenseData.particulars,
                payment_mode: expenseData.payment_mode,
                vendor_name: expenseData.vendor_name,
                invoice_amount: expenseData.invoice_amount,
                gst_percentage: expenseData.gst_percentage,
                gst_amount: expenseData.gst_amount,
                tds_deducted: expenseData.tds_deducted,
                net_payment: expenseData.net_payment,
                payment_date: expenseData.payment_date,
                remarks: expenseData.remarks,
                updated_at: new Date().toISOString()
            })
            .eq('id', expenseId)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to update expense' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Update expense error:', error);
        return NextResponse.json(
            { error: 'Failed to update expense' },
            { status: 500 }
        );
    }
}

// Delete expense (admin only)
export async function DELETE(request, { params }) {
    try {
        const { id: userId } = await params;
        const expenseId = userId;

        // Delete the expense
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .delete()
            .eq('id', expenseId)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to delete expense' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense' },
            { status: 500 }
        );
    }
}