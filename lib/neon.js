import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export { sql };

// Helper functions for common database operations
export const dbHelpers = {
  // Insert a new expense
  async insertExpense(expenseData) {
    const result = await sql`
      INSERT INTO expenses (
        date, voucher_no, category, particulars, payment_mode, 
        vendor_name, invoice_amount, gst_percentage, gst_amount, 
        tds_deducted, net_payment, payment_date, remarks
      ) VALUES (
        ${expenseData.date}, ${expenseData.voucher_no}, ${expenseData.category},
        ${expenseData.particulars}, ${expenseData.payment_mode}, ${expenseData.vendor_name},
        ${expenseData.invoice_amount}, ${expenseData.gst_percentage}, ${expenseData.gst_amount},
        ${expenseData.tds_deducted}, ${expenseData.net_payment}, ${expenseData.payment_date},
        ${expenseData.remarks}
      ) RETURNING *
    `;
    return result[0];
  },

  // Get all expenses
  async getAllExpenses() {
    const result = await sql`
      SELECT * FROM expenses 
      ORDER BY date DESC
    `;
    return result;
  },

  // Get expenses with pagination
  async getExpensesPaginated(limit = 10, offset = 0) {
    const result = await sql`
      SELECT * FROM expenses 
      ORDER BY date DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result;
  },

  // Get expense statistics
  async getExpenseStats() {
    const result = await sql`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(DISTINCT vendor_name) as total_vendors,
        SUM(net_payment) as total_expenses,
        AVG(net_payment) as avg_transaction_amount
      FROM expenses
    `;
    return result[0];
  },

  // Get expenses by category
  async getExpensesByCategory() {
    const result = await sql`
      SELECT 
        category,
        SUM(net_payment) as amount,
        COUNT(*) as count
      FROM expenses 
      GROUP BY category
      ORDER BY amount DESC
    `;
    return result;
  },

  // Get monthly expense trends
  async getMonthlyTrends() {
    const result = await sql`
      SELECT 
        TO_CHAR(date, 'Mon YYYY') as month,
        SUM(net_payment) as amount
      FROM expenses 
      WHERE date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'Mon YYYY'), DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date)
    `;
    return result;
  },

  // Get top vendors
  async getTopVendors(limit = 5) {
    const result = await sql`
      SELECT 
        vendor_name as vendor,
        SUM(net_payment) as amount,
        COUNT(*) as transactions
      FROM expenses 
      GROUP BY vendor_name
      ORDER BY amount DESC
      LIMIT ${limit}
    `;
    return result;
  }
};