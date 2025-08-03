
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['admin', 'cashier']);
export const paymentTypeSchema = z.enum(['cash', 'card', 'digital_wallet', 'bank_transfer']);
export const transactionStatusSchema = z.enum(['completed', 'cancelled', 'pending']);
export const printerTypeSchema = z.enum(['thermal_58mm', 'thermal_80mm']);

// User schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  password_hash: z.string(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: userRoleSchema.optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Category schemas
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  sku: z.string(),
  barcode: z.string().nullable(),
  price: z.number(),
  cost: z.number(),
  stock_quantity: z.number().int(),
  min_stock_level: z.number().int(),
  category_id: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  sku: z.string().min(1).max(50),
  barcode: z.string().nullable().optional(),
  price: z.number().positive(),
  cost: z.number().nonnegative(),
  stock_quantity: z.number().int().nonnegative(),
  min_stock_level: z.number().int().nonnegative(),
  category_id: z.number().nullable().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  sku: z.string().min(1).max(50).optional(),
  barcode: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  cost: z.number().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  min_stock_level: z.number().int().nonnegative().optional(),
  category_id: z.number().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Customer schemas
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Transaction schemas
export const transactionSchema = z.object({
  id: z.number(),
  transaction_number: z.string(),
  customer_id: z.number().nullable(),
  user_id: z.number(),
  total_amount: z.number(),
  discount_amount: z.number(),
  tax_amount: z.number(),
  payment_type: paymentTypeSchema,
  status: transactionStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  customer_id: z.number().nullable().optional(),
  user_id: z.number(),
  total_amount: z.number().positive(),
  discount_amount: z.number().nonnegative(),
  tax_amount: z.number().nonnegative(),
  payment_type: paymentTypeSchema,
  notes: z.string().nullable().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Transaction Item schemas
export const transactionItemSchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number(),
  created_at: z.coerce.date()
});

export type TransactionItem = z.infer<typeof transactionItemSchema>;

export const createTransactionItemInputSchema = z.object({
  transaction_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  total_price: z.number().positive()
});

export type CreateTransactionItemInput = z.infer<typeof createTransactionItemInputSchema>;

// Shop Settings schemas
export const shopSettingsSchema = z.object({
  id: z.number(),
  shop_name: z.string(),
  shop_address: z.string().nullable(),
  shop_phone: z.string().nullable(),
  shop_email: z.string().nullable(),
  tax_rate: z.number(),
  printer_type: printerTypeSchema,
  receipt_header: z.string().nullable(),
  receipt_footer: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;

export const updateShopSettingsInputSchema = z.object({
  shop_name: z.string().min(1).max(200).optional(),
  shop_address: z.string().nullable().optional(),
  shop_phone: z.string().nullable().optional(),
  shop_email: z.string().email().nullable().optional(),
  tax_rate: z.number().nonnegative().max(1).optional(),
  printer_type: printerTypeSchema.optional(),
  receipt_header: z.string().nullable().optional(),
  receipt_footer: z.string().nullable().optional()
});

export type UpdateShopSettingsInput = z.infer<typeof updateShopSettingsInputSchema>;

// Cart Item schema (for POS interface)
export const cartItemSchema = z.object({
  product_id: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().positive(),
  total: z.number()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const updateCartItemInputSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

// Report schemas
export const salesReportSchema = z.object({
  date: z.string(),
  total_sales: z.number(),
  total_transactions: z.number(),
  total_profit: z.number(),
  total_discount: z.number()
});

export type SalesReport = z.infer<typeof salesReportSchema>;

export const dateRangeInputSchema = z.object({
  start_date: z.string(),
  end_date: z.string()
});

export type DateRangeInput = z.infer<typeof dateRangeInputSchema>;
