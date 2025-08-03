
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { ShopSettings as ShopSettingsType, UpdateShopSettingsInput } from '../../../server/src/schema';

export function ShopSettings() {
  const [settings, setSettings] = useState<ShopSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UpdateShopSettingsInput>({
    shop_name: '',
    shop_address: null,
    shop_phone: null,
    shop_email: null,
    tax_rate: 0.1,
    printer_type: 'thermal_58mm',
    receipt_header: null,
    receipt_footer: null
  });

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trpc.getShopSettings.query();
      setSettings(data);
      if (data) {
        setFormData({
          shop_name: data.shop_name,
          shop_address: data.shop_address,
          shop_phone: data.shop_phone,
          shop_email: data.shop_email,
          tax_rate: data.tax_rate,
          printer_type: data.printer_type,
          receipt_header: data.receipt_header,
          receipt_footer: data.receipt_footer
        });
      }
    } catch (error) {
      console.error('Failed to load shop settings:', error);
      // Demo fallback
      setSettings(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updated = await trpc.updateShopSettings.mutate(formData);
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update shop settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p>Loading settings...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚙️</span>
            <span>Shop Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your shop information, tax rates, and printer settings
          </CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏪 Shop Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Shop Name *</Label>
              <Input
                value={formData.shop_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateShopSettingsInput) => ({ ...prev, shop_name: e.target.value }))
                }
                placeholder="Enter your shop name"
                required
              />
            </div>

            <div>
              <Label>Shop Address</Label>
              <Textarea
                value={formData.shop_address || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: UpdateShopSettingsInput) => ({ 
                    ...prev, 
                    shop_address: e.target.value || null 
                  }))
                }
                placeholder="Enter your shop address"
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Shop Phone</Label>
                <Input
                  value={formData.shop_phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateShopSettingsInput) => ({ 
                      ...prev, 
                      shop_phone: e.target.value || null 
                    }))
                  }
                  placeholder="Shop phone number"
                />
              </div>

              <div>
                <Label>Shop Email</Label>
                <Input
                  type="email"
                  value={formData.shop_email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: UpdateShopSettingsInput) => ({ 
                      ...prev, 
                      shop_email: e.target.value || null 
                    }))
                  }
                  placeholder="shop@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax & Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💰 Tax & Financial Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={(formData.tax_rate || 0) * 100}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateShopSettingsInput) => ({ 
                    ...prev, 
                    tax_rate: (parseFloat(e.target.value) || 0) / 100 
                  }))
                }
                step="0.1"
                min="0"
                max="100"
                placeholder="10"
              />
              <p className="text-sm text-gray-500 mt-1">
                Current rate: {((formData.tax_rate || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Printer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🖨️ Printer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Printer Type</Label>
              <Select
                value={formData.printer_type || 'thermal_58mm'}
                onValueChange={(value: 'thermal_58mm' | 'thermal_80mm') =>
                  setFormData((prev: UpdateShopSettingsInput) => ({ ...prev, printer_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal_58mm">🖨️ Thermal 58mm</SelectItem>
                  <SelectItem value="thermal_80mm">🖨️ Thermal 80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label>Receipt Header</Label>
              <Textarea
                value={formData.receipt_header || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: UpdateShopSettingsInput) => ({ 
                    ...prev, 
                    receipt_header: e.target.value || null 
                  }))
                }
                placeholder="Custom header text for receipts..."
                className="h-20"
              />
              <p className="text-sm text-gray-500 mt-1">
                This text will appear at the top of every receipt
              </p>
            </div>

            <div>
              <Label>Receipt Footer</Label>
              <Textarea
                value={formData.receipt_footer || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: UpdateShopSettingsInput) => ({ 
                    ...prev, 
                    receipt_footer: e.target.value || null 
                  }))
                }
                placeholder="Custom footer text for receipts..."
                className="h-20"
              />
              <p className="text-sm text-gray-500 mt-1">
                This text will appear at the bottom of every receipt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📄 Receipt Preview</CardTitle>
            <CardDescription>
              Preview how your receipts will look with current settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm max-w-sm mx-auto">
              <div className="text-center border-b border-gray-300 pb-2 mb-2">
                <div className="font-bold">{formData.shop_name || 'Shop Name'}</div>
                {formData.shop_address && (
                  <div className="text-xs mt-1">{formData.shop_address}</div>
                )}
                {formData.shop_phone && (
                  <div className="text-xs">{formData.shop_phone}</div>
                )}
                {formData.shop_email && (
                  <div className="text-xs">{formData.shop_email}</div>
                )}
                {formData.receipt_header && (
                  <div className="text-xs mt-2 border-t border-gray-300 pt-2">
                    {formData.receipt_header}
                  </div>
                )}
              </div>
              
              <div className="text-xs">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>Time: {new Date().toLocaleTimeString()}</div>
                <div>Transaction: #DEMO001</div>
              </div>

              <div className="border-t border-gray-300 mt-2 pt-2 text-xs">
                <div className="flex justify-between">
                  <span>Sample Product</span>
                  <span>$10.00</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                  <span>Subtotal:</span>
                  <span>$10.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({((formData.tax_rate || 0) * 100).toFixed(1)}%):</span>
                  <span>${((formData.tax_rate || 0) * 10).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                  <span>Total:</span>
                  <span>${(10 + (formData.tax_rate || 0) * 10).toFixed(2)}</span>
                </div>
              </div>

              {formData.receipt_footer && (
                <div className="text-xs text-center mt-2 pt-2 border-t border-gray-300">
                  {formData.receipt_footer}
                </div>
              )}

              <div className="text-xs text-center mt-2">
                Thank you for your business!
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={loadSettings}>
                Reset Changes
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : '💾 Save Settings'}
              </Button>
            </div>
            {!settings && (
              <p className="text-sm text-gray-500 mt-4">
                🔧 Settings functionality requires backend implementation
              </p>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
