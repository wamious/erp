'use client';

import { useState, useEffect } from 'react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  IndianRupee,
  Users,
  FileText,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedKPI, setExpandedKPI] = useState(null);
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
      setCategoryChartData(data.map((item, index) => ({
        category: item.category,
        amount: parseFloat(item.amount),
        fill: COLORS[index % COLORS.length]
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

  // Colors for pie chart
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(220 70% 50%)',
    'hsl(160 60% 45%)',
    'hsl(30 80% 55%)',
    'hsl(280 65% 60%)',
    'hsl(340 75% 55%)',
  ];

  // Chart configurations
  const monthlyChartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-1))",
    },
  };

  const vendorChartConfig = {
    amount: {
      label: "Amount",
      color: "hsl(var(--chart-2))",
    },
  };

  // Format currency for display
  const formatCurrency = (value, short = true) => {
    if (!short) {
      return `₹${value.toLocaleString()}`;
    }

    if (value >= 10000000) { // 1 crore
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) { // 1 lakh
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) { // 1 thousand
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toLocaleString()}`;
  };

  // Custom tooltip formatter for pie chart
  const renderPieTooltip = (props) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.payload.category}</p>
          <p className="text-blue-600 font-semibold">
            {formatCurrency(data.value, false)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip formatter for other charts
  const formatTooltipValue = (value) => {
    return [`₹${parseFloat(value).toLocaleString()}`, 'Amount'];
  };

  const toggleKPI = (kpiKey) => {
    setExpandedKPI(expandedKPI === kpiKey ? null : kpiKey);
  };

  const getKPIDisplayValue = (value, key) => {
    const isExpanded = expandedKPI === key;
    return isExpanded ? formatCurrency(value, false) : formatCurrency(value, true);
  };

  const getKPITextSize = (value, key) => {
    const isExpanded = expandedKPI === key;
    if (!isExpanded) return 'text-2xl';

    const fullText = formatCurrency(value, false);
    if (fullText.length > 15) return 'text-lg';
    if (fullText.length > 12) return 'text-xl';
    return 'text-2xl';
  };

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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <div className="flex items-center">
                <p className={`font-bold text-gray-900 truncate ${getKPITextSize(stats.totalExpenses, 'totalExpenses')}`}
                  title={formatCurrency(stats.totalExpenses, false)}>
                  {getKPIDisplayValue(stats.totalExpenses, 'totalExpenses')}
                </p>
                <button
                  onClick={() => toggleKPI('totalExpenses')}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expandedKPI === 'totalExpenses' ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-full flex-shrink-0">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVendors}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-full flex-shrink-0">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full flex-shrink-0">
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <div className="flex items-center">
                <p className={`font-bold text-gray-900 truncate ${getKPITextSize(stats.avgTransactionAmount, 'avgTransaction')}`}
                  title={formatCurrency(stats.avgTransactionAmount, false)}>
                  {getKPIDisplayValue(stats.avgTransactionAmount, 'avgTransaction')}
                </p>
                <button
                  onClick={() => toggleKPI('avgTransaction')}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expandedKPI === 'avgTransaction' ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-full flex-shrink-0">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expenses by Category</h3>
            <div className="text-sm text-gray-500">
              {categoryChartData.length} categories
            </div>
          </div>
          <div className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={renderPieTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Expense Trend</h3>
            <div className="text-sm text-gray-500">
              Current FY
            </div>
          </div>
          <ChartContainer config={monthlyChartConfig} className="h-[300px]">
            <LineChart
              data={monthlyChartData}
              margin={{
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={formatTooltipValue} />}
              />
              <Line
                dataKey="amount"
                type="monotone"
                stroke="var(--color-amount)"
                strokeWidth={3}
                dot={{
                  fill: "var(--color-amount)",
                  strokeWidth: 2,
                  r: 4
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Vendors</h3>
            <div className="text-sm text-gray-500">
              By total amount
            </div>
          </div>
          <ChartContainer config={vendorChartConfig} className="h-[350px]">
            <BarChart
              data={topVendors}
              layout="horizontal"
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatCurrency(value, true)}
              />
              <YAxis
                dataKey="vendor"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={100}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={formatTooltipValue} />}
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <div className="text-sm text-gray-500">
              Latest 5 entries
            </div>
          </div>
          <div className="space-y-4">
            {expenses.slice(0, 5).map((expense, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {expense.vendor_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {expense.category} • {format(new Date(expense.date), 'MMM dd')}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(parseFloat(expense.net_payment || 0), true)}
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