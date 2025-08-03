
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, Product, Customer, CartItem, CreateTransactionInput } from '../../../server/src/schema';

interface POSInterfaceProps {
  currentUser: User;
}

export function POSInterface({ currentUser }: POSInterfaceProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'digital_wallet' | 'bank_transfer'>('cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRate] = useState(0.1); // 10% tax rate
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [productsData, customersData] = await Promise.all([
        trpc.getProducts.query(),
        trpc.getCustomers.query()
      ]);
      setProducts(productsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load POS data:', error);
      // Demo fallback data
      setProducts([]);
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart((prevCart: CartItem[]) => {
      const existingItem = prevCart.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product_id === product.id
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price
              }
            : item
        );
      } else {
        return [...prevCart, {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price
        }];
      }
    });
  };

  const updateCartItem = (productId: number, quantity: number, price?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart: CartItem[]) =>
      prevCart.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              price: price !== undefined ? price : item.price,
              total: quantity * (price !== undefined ? price : item.price)
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart: CartItem[]) => prevCart.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setNotes('');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount - discountAmount;

  const processTransaction = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const transactionData: CreateTransactionInput = {
        customer_id: selectedCustomer,
        user_id: currentUser.id,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        payment_type: paymentType,
        notes: notes || null
      };

      const transaction = await trpc.createTransaction.mutate(transactionData);
      
      // Create transaction items
      for (const item of cart) {
        await trpc.createTransactionItem.mutate({
          transaction_id: transaction.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total
        });
      }

      setLastTransaction(`Transaction #${transaction.transaction_number} completed successfully!`);
      clearCart();
    } catch (error) {
      console.error('Failed to process transaction:', error);
      setLastTransaction('Transaction processing failed (Demo Mode - Backend stub)');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Search & Selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🔍</span>
              <span>Product Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="text-lg"
            />
          </CardContent>
        </Card>

        {/* Product Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <CardDescription>Click to add items to cart</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No products available</p>
                <p className="text-sm text-gray-400 mt-2">🔧 Backend is using stub data</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product: Product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm">{product.name}</h3>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-green-600">
                            ${product.price.toFixed(2)}
                          </span>
                          <Badge variant={product.stock_quantity > product.min_stock_level ? "default" : "destructive"}>
                            Stock: {product.stock_quantity}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart & Checkout */}
      <div className="space-y-6">
        {/* Transaction Alert */}
        {lastTransaction && (
          <Alert>
            <AlertDescription>{lastTransaction}</AlertDescription>
          </Alert>
        )}

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>🛒</span>
                <span>Shopping Cart</span>
              </span>
              <Badge variant="outline">{cart.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item: CartItem) => (
                  <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateCartItem(item.product_id, parseInt(e.target.value) || 0)
                          }
                          className="w-16 h-8 text-xs"
                          min="0"
                        />
                        <span className="text-xs text-gray-500">×</span>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateCartItem(item.product_id, item.quantity, parseFloat(e.target.value) || 0)
                          }
                          className="w-20 h-8 text-xs"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.total.toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-600 hover:text-red-800 h-6 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Customer (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCustomer?.toString() || 'none'} onValueChange={(value) => setSelectedCustomer(value === 'none' ? null : parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No customer</SelectItem>
                {customers.map((customer: Customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Payment Details */}
        {cart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Type */}
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={paymentType} onValueChange={(value: 'cash' | 'card' | 'digital_wallet' | 'bank_transfer') => setPaymentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="card">💳 Card</SelectItem>
                    <SelectItem value="digital_wallet">📱 Digital Wallet</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount */}
              <div>
                <Label className="text-xs">Discount Amount</Label>
                <Input
                  type="number"
                  value={discountAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  max={subtotal}
                />
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Transaction notes..."
                  className="h-16 text-sm"
                />
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  onClick={processTransaction}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : '💳 Complete Sale'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                    🗑️ Clear
                  </Button>
                  <Button variant="outline" disabled={cart.length === 0}>
                    🖨️ Print
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
