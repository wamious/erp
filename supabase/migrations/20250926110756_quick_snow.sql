-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    voucher_no VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    particulars TEXT NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    invoice_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    tds_deducted DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_voucher ON expenses(voucher_no);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expenses_updated_at 
    BEFORE UPDATE ON expenses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO expenses (
    date, voucher_no, category, particulars, payment_mode, vendor_name,
    invoice_amount, gst_percentage, gst_amount, tds_deducted, net_payment, payment_date, remarks
) VALUES 
(
    '2025-01-02', 'EXP/2025/001', 'Compliance & Paperwork', 
    'DSC Making fees for Giriraj Singh Professional fees: 700 Director appointment government fees: 400 Professional fees: 700 Director resignation government fees: 400 Professional fee for director resignation (Saraswati): 700',
    'UPI', 'AR JK & CO.', 1490.00, 0, 0, 0, 1490.00, '2025-01-02', 'Paid by Naman'
),
(
    '2025-01-14', 'EXP/2025/002', 'Compliance & Paperwork',
    'resignation (Saraswati): 700',
    'UPI', 'AR JK & CO.', 3490.00, 0, 0, 0, 3490.00, '2025-01-14', 'Paid by Naman'
) ON CONFLICT (voucher_no) DO NOTHING;