
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { DashboardView } from '@/components/DashboardView';
import { ProductManagement } from '@/components/ProductManagement';
import { CategoryManagement } from '@/components/CategoryManagement';
import { UserManagement } from '@/components/UserManagement';
import { POSInterface } from '@/components/POSInterface';
import { TransactionHistory } from '@/components/TransactionHistory';
import { ReportsView } from '@/components/ReportsView';
import { ShopSettings } from '@/components/ShopSettings';
import type { User } from '../../server/src/schema';

// Demo users for role switching - this replaces authentication system for demo purposes
const DEMO_ADMIN_USER: User = {
  id: 1,
  username: 'admin',
  email: 'admin@shop.com',
  password_hash: '',
  role: 'admin',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const DEMO_CASHIER_USER: User = {
  id: 2,
  username: 'cashier',
  email: 'cashier@shop.com',
  password_hash: '',
  role: 'cashier',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

function App() {
  const [currentUser, setCurrentUser] = useState<User>(DEMO_ADMIN_USER);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);

  // Test connection to backend
  const testConnection = useCallback(async () => {
    try {
      await trpc.healthcheck.query();
      setIsConnected(true);
    } catch (error) {
      console.error('Backend connection failed:', error);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const switchUser = (role: 'admin' | 'cashier') => {
    setCurrentUser(role === 'admin' ? DEMO_ADMIN_USER : DEMO_CASHIER_USER);
    setActiveTab('dashboard');
  };

  const isAdmin = currentUser.role === 'admin';
  const isCashier = currentUser.role === 'cashier';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🏪 Retail POS System</h1>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Connected" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Demo User:</span>
                <Badge variant={isAdmin ? "default" : "secondary"}>
                  {currentUser.username} ({currentUser.role})
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={isAdmin ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchUser('admin')}
                >
                  Admin View
                </Button>
                <Button
                  variant={isCashier ? "default" : "outline"}
                  size="sm"
                  onClick={() => switchUser('cashier')}
                >
                  Cashier View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <span>📊</span>
              <span>Dashboard</span>
            </TabsTrigger>
            
            <TabsTrigger value="pos" className="flex items-center space-x-2">
              <span>🛒</span>
              <span>POS</span>
            </TabsTrigger>
            
            {isAdmin && (
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <span>📦</span>
                <span>Products</span>
              </TabsTrigger>
            )}
            
            {isAdmin && (
              <TabsTrigger value="categories" className="flex items-center space-x-2">
                <span>🏷️</span>
                <span>Categories</span>
              </TabsTrigger>
            )}
            
            {isAdmin && (
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <span>👥</span>
                <span>Users</span>
              </TabsTrigger>
            )}
            
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <span>📋</span>
              <span>Transactions</span>
            </TabsTrigger>
            
            {isAdmin && (
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <span>📈</span>
                <span>Reports</span>
              </TabsTrigger>
            )}
            
            {isAdmin && (
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <span>⚙️</span>
                <span>Settings</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardView currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="pos" className="space-y-6">
            <POSInterface currentUser={currentUser} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="products" className="space-y-6">
              <ProductManagement />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="categories" className="space-y-6">
              <CategoryManagement />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
            </TabsContent>
          )}

          <TabsContent value="transactions" className="space-y-6">
            <TransactionHistory currentUser={currentUser} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="reports" className="space-y-6">
              <ReportsView />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="settings" className="space-y-6">
              <ShopSettings />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>🔧 <strong>Demo Mode:</strong> Backend handlers are currently stubs. Real data integration pending.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
