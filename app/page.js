'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-expense':
        return <ExpenseForm onExpenseAdded={() => setActiveTab('dashboard')} />;
      case 'expenses':
        return <ExpenseList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="py-6">
        {renderContent()}
      </main>
    </div>
  );
}