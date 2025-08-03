
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'cashier']);
export const paymentTypeEnum = pgEnum('payment_type', ['cash', 'card', 'digital_wallet', 'bank_transfer']);
export const transactionStatusEnum = pgEnum('transaction_status', ['completed', 'cancelled', 'pending']);
export const printerTypeEnum = pgEnum('printer_type', ['thermal_58mm', 'thermal_80mm']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer('stock_quantity').notNull(),
  min_stock_level: integer('min_stock_level').notNull().default(0),
  category_id: integer('category_id'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  transaction_number: text('transaction_number').notNull().unique(),
  customer_id: integer('customer_id'),
  user_id: integer('user_id').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  tax_amount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  payment_type: paymentTypeEnum('payment_type').notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transaction Items table
export const transactionItemsTable = pgTable('transaction_items', {
  id: serial('id').primaryKey(),
  transaction_id: integer('transaction_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Shop Settings table
export const shopSettingsTable = pgTable('shop_settings', {
  id: serial('id').primaryKey(),
  shop_name: text('shop_name').notNull(),
  shop_address: text('shop_address'),
  shop_phone: text('shop_phone'),
  shop_email: text('shop_email'),
  tax_rate: numeric('tax_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  printer_type: printerTypeEnum('printer_type').notNull().default('thermal_58mm'),
  receipt_header: text('receipt_header'),
  receipt_footer: text('receipt_footer'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  transactions: many(transactionsTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  products: many(productsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [productsTable.category_id],
    references: [categoriesTable.id],
  }),
  transactionItems: many(transactionItemsTable),
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  transactions: many(transactionsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [transactionsTable.customer_id],
    references: [customersTable.id],
  }),
  user: one(usersTable, {
    fields: [transactionsTable.user_id],
    references: [usersTable.id],
  }),
  items: many(transactionItemsTable),
}));

export const transactionItemsRelations = relations(transactionItemsTable, ({ one }) => ({
  transaction: one(transactionsTable, {
    fields: [transactionItemsTable.transaction_id],
    references: [transactionsTable.id],
  }),
  product: one(productsTable, {
    fields: [transactionItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  categories: categoriesTable,
  products: productsTable,
  customers: customersTable,
  transactions: transactionsTable,
  transactionItems: transactionItemsTable,
  shopSettings: shopSettingsTable,
};
