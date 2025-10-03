import { supabase } from './supabase';

const EXPENSES_TABLE = 'erp_expenses';

export const dbHelpers = {
    // Insert a new expense
    async insertExpense(expenseData) {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .insert([{
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
                attachments: expenseData.attachments || [],
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get all expenses
    async getAllExpenses() {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get expenses with pagination
    async getExpensesPaginated(limit = 10, offset = 0) {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select('*')
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
    },

    // Get expense statistics
    async getExpenseStats() {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select(`
                vendor_name,
                net_payment
            `);

        if (error) throw error;

        const total_transactions = data.length;
        const total_vendors = new Set(data.map(e => e.vendor_name)).size;
        const total_expenses = data.reduce((sum, e) => sum + (e.net_payment || 0), 0);
        const avg_transaction_amount = total_transactions > 0 ? total_expenses / total_transactions : 0;

        return {
            total_transactions,
            total_vendors,
            total_expenses,
            avg_transaction_amount,
        };
    },

    // Get expenses by category
    async getExpensesByCategory() {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select('category, net_payment');

        if (error) throw error;

        const grouped = data.reduce((acc, e) => {
            acc[e.category] = acc[e.category] || { category: e.category, amount: 0, count: 0 };
            acc[e.category].amount += e.net_payment || 0;
            acc[e.category].count += 1;
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    },

    // Get monthly expense trends
    async getMonthlyTrends() {

        const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select('date, net_payment');

        if (error) throw error;

        const now = new Date();

        // Get last 12 months consistently
        const last12Months = [...Array(12)].map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        }).reverse();

        // Initialize all months with 0
        const monthly = {};
        last12Months.forEach(m => (monthly[m] = { month: m, amount: 0 }));

        // Fill with actual expense data
        data.forEach(e => {
            const d = new Date(e.date);
            const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
            if (monthly[key]) {
                monthly[key].amount += e.net_payment || 0;
            }
        });

        return Object.values(monthly);
    },

    // Get top vendors
    async getTopVendors(limit = 5) {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select('vendor_name, net_payment');

        if (error) throw error;

        const grouped = data.reduce((acc, e) => {
            acc[e.vendor_name] = acc[e.vendor_name] || { vendor: e.vendor_name, amount: 0, transactions: 0 };
            acc[e.vendor_name].amount += e.net_payment || 0;
            acc[e.vendor_name].transactions += 1;
            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    },

    // Get latest voucher number
    async getLatestVoucherNumber() {
        const { data, error } = await supabase
            .from(EXPENSES_TABLE)
            .select('voucher_no')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
        return data;
    },
};