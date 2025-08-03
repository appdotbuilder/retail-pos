
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { SalesReport, DateRangeInput } from '../../../server/src/schema';

// Type for profit report based on actual handler return type
type ProfitReport = {
  total_profit: number;
  total_cost: number;
  profit_margin: number;
};

export function ReportsView() {
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [profitReport, setProfitReport] = useState<ProfitReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeInput>({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const generateReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const [salesData, profitData] = await Promise.all([
        trpc.getSalesReport.query(dateRange),
        trpc.getProfitReport.query(dateRange)
      ]);
      setSalesReport(salesData);
      setProfitReport(profitData);
    } catch (error) {
      console.error('Failed to generate reports:', error);
      // Demo fallback
      setSalesReport([]);
      setProfitReport({ total_profit: 0, total_cost: 0, profit_margin: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  const calculateSalesTotals = (data: SalesReport[]) => {
    return data.reduce(
      (acc, item) => ({
        sales: acc.sales + item.total_sales,
        transactions: acc.transactions + item.total_transactions,
        profit: acc.profit + item.total_profit,
        discount: acc.discount + item.total_discount
      }),
      { sales: 0, transactions: 0, profit: 0, discount: 0 }
    );
  };

  const salesTotals = calculateSalesTotals(salesReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📈</span>
            <span>Sales & Profit Reports</span>
          </CardTitle>
          <CardDescription>
            Generate detailed reports for sales analysis and business insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange((prev: DateRangeInput) => ({ ...prev, start_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDateRange((prev: DateRangeInput) => ({ ...prev, end_date: e.target.value }))
                  }
                />
              </div>
            </div>
            <Button onClick={generateReports} disabled={isLoading}>
              {isLoading ? 'Generating...' : '📊 Generate Reports'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${salesTotals.sales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange.start_date} to {dateRange.end_date}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <span className="text-2xl">🛒</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesTotals.transactions}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(profitReport?.total_profit || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue minus costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <span className="text-2xl">🏷️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${salesTotals.discount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Discounts given
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💰</span>
              <span>Daily Sales Report</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesReport.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No sales data available</p>
                <p className="text-sm text-gray-400 mt-2">🔧 Backend is using stub data</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesReport.map((item: SalesReport, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{item.date}</h4>
                      <span className="text-lg font-bold text-green-600">
                        ${item.total_sales.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Transactions: {item.total_transactions}</div>
                      <div>Discounts: ${item.total_discount.toFixed(2)}</div>
                      <div>Profit: ${item.total_profit.toFixed(2)}</div>
                      <div>Date: {item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📈</span>
              <span>Profit Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!profitReport ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No profit data available</p>
                <p className="text-sm text-gray-400 mt-2">🔧 Backend is using stub data</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Profit</span>
                      <span className="text-lg font-bold text-blue-600">
                        ${profitReport.total_profit.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Cost</span>
                      <span className="text-lg font-bold text-red-600">
                        ${profitReport.total_cost.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Profit Margin</span>
                      <span className="text-lg font-bold text-green-600">
                        {(profitReport.profit_margin * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Profit Insights */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Revenue Performance</div>
                    <div className="text-xs text-blue-700 mt-1">
                      Total revenue generated: ${(profitReport.total_profit + profitReport.total_cost).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-900">Cost Efficiency</div>
                    <div className="text-xs text-green-700 mt-1">
                      {profitReport.profit_margin > 0.2 
                        ? 'Excellent profit margin!' 
                        : profitReport.profit_margin > 0.1 
                        ? 'Good profit margin' 
                        : 'Consider optimizing costs'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📄</span>
            <span>Export Reports</span>
          </CardTitle>
          <CardDescription>
            Export your reports in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" disabled>
              📊 Export to Excel
            </Button>
            <Button variant="outline" disabled>
              📋 Export to CSV
            </Button>
            <Button variant="outline" disabled>
              📄 Export to PDF
            </Button>
            <Button variant="outline" disabled>
              🖨️ Print Report
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            🔧 Export functionality requires backend implementation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
