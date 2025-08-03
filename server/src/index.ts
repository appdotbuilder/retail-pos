
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  createCustomerInputSchema,
  createTransactionInputSchema,
  createTransactionItemInputSchema,
  updateShopSettingsInputSchema,
  dateRangeInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { updateProduct } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { cancelTransaction } from './handlers/cancel_transaction';
import { createTransactionItem } from './handlers/create_transaction_item';
import { getShopSettings } from './handlers/get_shop_settings';
import { updateShopSettings } from './handlers/update_shop_settings';
import { getDailyRevenue } from './handlers/get_daily_revenue';
import { getSalesReport } from './handlers/get_sales_report';
import { getProfitReport } from './handlers/get_profit_report';
import { searchProducts } from './handlers/search_products';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  deleteUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteUser(input.id)),

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  getCategories: publicProcedure
    .query(() => getCategories()),
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCategory(input.id)),

  // Product management routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  getProducts: publicProcedure
    .query(() => getProducts()),
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),
  deleteProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteProduct(input.id)),
  searchProducts: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => searchProducts(input.query)),

  // Customer management routes
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  getCustomers: publicProcedure
    .query(() => getCustomers()),

  // Transaction routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  getTransactions: publicProcedure
    .query(() => getTransactions()),
  cancelTransaction: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => cancelTransaction(input.id)),
  createTransactionItem: publicProcedure
    .input(createTransactionItemInputSchema)
    .mutation(({ input }) => createTransactionItem(input)),

  // Shop settings routes
  getShopSettings: publicProcedure
    .query(() => getShopSettings()),
  updateShopSettings: publicProcedure
    .input(updateShopSettingsInputSchema)
    .mutation(({ input }) => updateShopSettings(input)),

  // Reporting routes
  getDailyRevenue: publicProcedure
    .input(z.object({ date: z.string().optional() }))
    .query(({ input }) => getDailyRevenue(input.date)),
  getSalesReport: publicProcedure
    .input(dateRangeInputSchema)
    .query(({ input }) => getSalesReport(input)),
  getProfitReport: publicProcedure
    .input(dateRangeInputSchema)
    .query(({ input }) => getProfitReport(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
