
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User } from '../../../server/src/schema';

interface DashboardViewProps {
  currentUser: User;
}

export function DashboardView({ currentUser }: DashboardViewProps) {
  const [dailyRevenue, setDailyRevenue] = useState<{ revenue: number; date: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const revenue = await trpc.getDailyRevenue.query({});
      setDailyRevenue(revenue);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback for demo
      setDailyRevenue({
        revenue: 0,
        date: new Date().toISOString().split('T')[0]
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const isAdmin = currentUser.role === 'admin';
  const today = new Date().toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome back, {currentUser.username}! 👋
          </CardTitle>
          <CardDescription className="text-blue-100">
            {isAdmin ? 'Admin Dashboard' : 'Cashier Dashboard'} • {today}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? '...' : `$${dailyRevenue?.revenue.toFixed(2) || '0.00'}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyRevenue?.date || today}
            </p>
          </CardContent>
        </Card>

        {/* Products Status */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Products in catalog
            </p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">0</div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📋</span>
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">System Status</p>
                  <p className="text-xs text-gray-500">Backend handlers are stubs</p>
                </div>
                <Badge variant="secondary">Demo</Badge>
              </div>
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">No recent transactions</p>
                <p className="text-xs">Start making sales to see activity here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Quick Stats</span>
            </CardTitle>
            <CardDescription>Overview of key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Categories</span>
                <span className="font-medium">0</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customers</span>
                <span className="font-medium">0</span>
              </div>
              <Separator />
              {isAdmin && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-medium">0</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Methods</span>
                <span className="font-medium">4</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{isAdmin ? '🔐' : '💼'}</span>
            <span>{isAdmin ? 'Admin Features' : 'Cashier Features'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin ? (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium">Management</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Product & Category Management</li>
                    <li>• User Account Management</li>
                    <li>• Shop Settings Configuration</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Reporting</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Sales & Profit Reports</li>
                    <li>• Transaction Cancellation</li>
                    <li>• Printer Configuration</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium">Sales Operations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Process Sales Transactions</li>
                    <li>• Cart Management</li>
                    <li>• Multiple Payment Methods</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Daily Operations</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Print Sales Receipts</li>
                    <li>• Edit Product Prices</li>
                    <li>• End-of-day Revenue</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
