import { NextResponse } from 'next/server';
import { dbHelpers } from '@/lib/supabaseHelpers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await dbHelpers.getExpenseStats();
        return NextResponse.json(stats);

      case 'categories':
        const categories = await dbHelpers.getExpensesByCategory();
        return NextResponse.json(categories);

      case 'monthly':
        const monthly = await dbHelpers.getMonthlyTrends();
        return NextResponse.json(monthly);

      case 'vendors':
        const vendors = await dbHelpers.getTopVendors();
        return NextResponse.json(vendors);

      default:
        const expenses = await dbHelpers.getAllExpenses();
        return NextResponse.json(expenses);
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const expenseData = await request.json();
    // console.log('Received expense data:', expenseData);
    const newExpense = await dbHelpers.insertExpense(expenseData);
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}