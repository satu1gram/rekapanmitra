import { useState } from 'react';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { OrdersPage } from '@/components/orders/OrdersPage';
import { StockPage } from '@/components/stock/StockPage';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { AuthPage } from '@/components/auth/AuthPage';
import { useAuth } from '@/hooks/useAuth';
import { TabId } from '@/components/navigation/NavItems';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [openAddForm, setOpenAddForm] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleNavigate = (tab: TabId, action?: string) => {
    if (tab === 'orders' && action === 'add') {
      setOpenAddForm(true);
    } else {
      setOpenAddForm(false);
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'orders':
        return (
          <OrdersPage
            openAddForm={openAddForm}
            onAddFormClose={() => setOpenAddForm(false)}
          />
        );
      case 'stock':
        return <StockPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col relative pb-32">
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={(tab) => handleNavigate(tab)} />
    </div>
  );
};

export default Index;
