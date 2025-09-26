'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  TrendingUp,
  IndianRupee,
  Users,
  FileText,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalVendors: 0,
    totalTransactions: 0,
    avgTransactionAmount: 0,
  });

  useEffect(() => {
    fetchExpenses();
    fetchStats();
    fetchCategoryData();
    fetchMonthlyData();
    fetchVendorData();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/expenses?action=stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats({
        totalExpenses: parseFloat(data.total_expenses || 0),
        totalVendors: parseInt(data.total_vendors || 0),
        totalTransactions: parseInt(data.total_transactions || 0),
        avgTransactionAmount: parseFloat(data.avg_transaction_amount || 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const response = await fetch('/api/expenses?action=categories');
      if (!response.ok) throw new Error('Failed to fetch category data');
      const data = await response.json();
      setCategoryChartData(data.map(item => ({
        category: item.category,
        amount: parseFloat(item.amount)
      })));
    } catch (error) {
      console.error('Error fetching category data:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const response = await fetch('/api/expenses?action=monthly');
      if (!response.ok) throw new Error('Failed to fetch monthly data');
      const data = await response.json();
      setMonthlyChartData(data.map(item => ({
        month: item.month,
        amount: parseFloat(item.amount)
      })));
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  const fetchVendorData = async () => {
    try {
      const response = await fetch('/api/expenses?action=vendors');
      if (!response.ok) throw new Error('Failed to fetch vendor data');
      const data = await response.json();
      setTopVendors(data.map(item => ({
        vendor: item.vendor,
        amount: parseFloat(item.amount)
      })));
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    }
  };

  // State for chart data
  const [categoryChartData, setCategoryChartData] = useState([]);
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [topVendors, setTopVendors] = useState([]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="text-sm text-gray-500">
          Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.totalExpenses.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <IndianRupee className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">12.5%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVendors}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">3</span>
            <span className="text-gray-500 ml-1">new this month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">8.3%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <p className="text-3xl font-bold text-gray-900">₹{stats.avgTransactionAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-red-600">2.1%</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`]} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  formatter={(value, entry, index) => {
                    const total = categoryChartData.reduce((sum, item) => sum + item.amount, 0);
                    const percent = ((categoryChartData[index].amount / total) * 100).toFixed(0);
                    return `${categoryChartData[index].category} (${percent}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Expense Trend (Current FY)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyChartData.filter((item) => {
                  const now = new Date();
                  const currentYear = now.getFullYear();
                  const currentMonth = now.getMonth() + 1; // 1-based
                  const fyStartYear = currentMonth < 4 ? currentYear - 1 : currentYear;
                  const fyStartDate = new Date(fyStartYear, 3, 1); // April
                  const expDate = new Date(item.month); // assumes "month" is a valid date string

                  return expDate >= fyStartDate && expDate <= now;
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(tick) => {
                    const date = new Date(tick);
                    return date.toLocaleString('default', { month: 'short' }); // e.g. Apr
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Vendors</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendors} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" formatter={(value) => `₹${value.toLocaleString()}`} />
                <YAxis
                  type="category"
                  dataKey="vendor"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {expenses.slice(0, 5).map((expense, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expense.vendor_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {expense.category} • {format(new Date(expense.date), 'MMM dd')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{parseFloat(expense.net_payment || 0).toLocaleString()}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${expense.payment_mode === 'UPI'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                    }`}>
                    {expense.payment_mode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}