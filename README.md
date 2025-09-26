# Expense Tracker - Vendor Payment Management

A modern Next.js application for tracking and managing vendor payments with comprehensive analytics, built with Neon PostgreSQL database.

## Features

- **Expense Management**: Add, view, and manage vendor payments with detailed information
- **Dashboard Analytics**: Comprehensive dashboard with charts, graphs, and KPIs
- **Database Integration**: Secure PostgreSQL storage using Neon serverless database
- **Modern UI/UX**: Clean, responsive design with intuitive navigation
- **Export Functionality**: Export expense data to CSV for reporting
- **Real-time Calculations**: Automatic GST and net payment calculations

## Tech Stack

- **Frontend**: Next.js 13, React, JavaScript/JSX
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Neon PostgreSQL (serverless)
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with validation
- **Icons**: Lucide React

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Neon database account and project

### Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Neon Database**:
   - Create a new project at [Neon Console](https://console.neon.tech)
   - Copy your connection string from the dashboard
   - Create a `.env.local` file and add your database URL:
     ```
     DATABASE_URL=postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```

3. **Initialize the database**:
   - Connect to your Neon database using the SQL Editor in the console
   - Run the SQL script from `scripts/init-db.sql` to create tables and sample data

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## Database Schema

The application uses a single `expenses` table with the following structure:

- `id`: Primary key (auto-increment)
- `date`: Expense date
- `voucher_no`: Unique voucher number
- `category`: Expense category
- `particulars`: Detailed description
- `payment_mode`: Payment method (UPI, Bank Transfer, etc.)
- `vendor_name`: Vendor/party name
- `invoice_amount`: Base invoice amount
- `gst_percentage`: GST percentage applied
- `gst_amount`: Calculated GST amount
- `tds_deducted`: TDS amount deducted
- `net_payment`: Final payment amount
- `payment_date`: Date of payment
- `remarks`: Additional notes
- `created_at`, `updated_at`: Timestamps

## API Endpoints

- `GET /api/expenses` - Get all expenses
- `GET /api/expenses?action=stats` - Get expense statistics
- `GET /api/expenses?action=categories` - Get category breakdown
- `GET /api/expenses?action=monthly` - Get monthly trends
- `GET /api/expenses?action=vendors` - Get top vendors
- `POST /api/expenses` - Create new expense

## Features Overview

### Dashboard
- Total expenses, vendors, and transaction KPIs
- Category-wise expense breakdown (pie chart)
- Monthly expense trends (line chart)
- Top 5 vendors (horizontal bar chart)
- Recent transactions list

### Expense Form
- Comprehensive form with all required fields
- Automatic GST and net payment calculations
- Form validation and error handling
- Success/error feedback

### Expense List
- Paginated table view of all expenses
- Search and filter functionality
- Export to CSV capability
- Responsive design for mobile devices

## Customization

The application is built with modularity in mind. You can easily:

- Add new expense categories in the form component
- Modify the dashboard charts and KPIs
- Extend the database schema for additional fields
- Customize the UI theme and colors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.