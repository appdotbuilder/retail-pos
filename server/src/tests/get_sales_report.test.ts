
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, customersTable, transactionsTable, transactionItemsTable } from '../db/schema';
import { type DateRangeInput } from '../schema';
import { getSalesReport } from '../handlers/get_sales_report';

describe('getSalesReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const input: DateRangeInput = {
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    };

    const result = await getSalesReport(input);
    expect(result).toEqual([]);
  });

  it('should generate sales report for date range', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();
    const categoryId = categoryResult[0].id;

    // Create test products
    const productResults = await db.insert(productsTable)
      .values([
        {
          name: 'Product 1',
          sku: 'SKU001',
          price: '10.00',
          cost: '5.00',
          stock_quantity: 100,
          min_stock_level: 10,
          category_id: categoryId
        },
        {
          name: 'Product 2',
          sku: 'SKU002',
          price: '20.00',
          cost: '12.00',
          stock_quantity: 50,
          min_stock_level: 5,
          category_id: categoryId
        }
      ])
      .returning()
      .execute();
    const product1Id = productResults[0].id;
    const product2Id = productResults[1].id;

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@example.com'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create transactions for different dates
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Transaction 1 - Today
    const transaction1Result = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN001',
        customer_id: customerId,
        user_id: userId,
        total_amount: '30.00',
        discount_amount: '5.00',
        tax_amount: '2.00',
        payment_type: 'cash',
        status: 'completed',
        created_at: today
      })
      .returning()
      .execute();
    const transaction1Id = transaction1Result[0].id;

    // Add items to transaction 1
    await db.insert(transactionItemsTable)
      .values([
        {
          transaction_id: transaction1Id,
          product_id: product1Id,
          quantity: 1,
          unit_price: '10.00',
          total_price: '10.00'
        },
        {
          transaction_id: transaction1Id,
          product_id: product2Id,
          quantity: 1,
          unit_price: '20.00',
          total_price: '20.00'
        }
      ])
      .execute();

    // Transaction 2 - Yesterday
    const transaction2Result = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN002',
        customer_id: customerId,
        user_id: userId,
        total_amount: '40.00',
        discount_amount: '0.00',
        tax_amount: '3.00',
        payment_type: 'card',
        status: 'completed',
        created_at: yesterday
      })
      .returning()
      .execute();
    const transaction2Id = transaction2Result[0].id;

    // Add items to transaction 2
    await db.insert(transactionItemsTable)
      .values([
        {
          transaction_id: transaction2Id,
          product_id: product2Id,
          quantity: 2,
          unit_price: '20.00',
          total_price: '40.00'
        }
      ])
      .execute();

    // Test date range covering both transactions
    const startDate = new Date(yesterday);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);

    const input: DateRangeInput = {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };

    const result = await getSalesReport(input);

    // Should return 2 days of data
    expect(result).toHaveLength(2);

    // Find today's and yesterday's reports
    const todayReport = result.find(r => r.date === today.toISOString().split('T')[0]);
    const yesterdayReport = result.find(r => r.date === yesterday.toISOString().split('T')[0]);

    // Validate today's report
    expect(todayReport).toBeDefined();
    expect(todayReport!.total_sales).toEqual(30);
    expect(todayReport!.total_transactions).toEqual(1);
    expect(todayReport!.total_discount).toEqual(5);
    expect(todayReport!.total_profit).toEqual(13); // 30 - (5 + 12) = 13

    // Validate yesterday's report
    expect(yesterdayReport).toBeDefined();
    expect(yesterdayReport!.total_sales).toEqual(40);
    expect(yesterdayReport!.total_transactions).toEqual(1);
    expect(yesterdayReport!.total_discount).toEqual(0);
    expect(yesterdayReport!.total_profit).toEqual(16); // 40 - (12 * 2) = 16
  });

  it('should only include completed transactions', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'admin'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        sku: 'SKU001',
        price: '15.00',
        cost: '8.00',
        stock_quantity: 100,
        min_stock_level: 10
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    const today = new Date();

    // Create completed transaction
    const completedTxnResult = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN001',
        user_id: userId,
        total_amount: '15.00',
        discount_amount: '0.00',
        tax_amount: '1.00',
        payment_type: 'cash',
        status: 'completed',
        created_at: today
      })
      .returning()
      .execute();

    // Create pending transaction (should be excluded)
    await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN002',
        user_id: userId,
        total_amount: '25.00',
        discount_amount: '0.00',
        tax_amount: '2.00',
        payment_type: 'card',
        status: 'pending',
        created_at: today
      })
      .execute();

    // Add items only to completed transaction
    await db.insert(transactionItemsTable)
      .values({
        transaction_id: completedTxnResult[0].id,
        product_id: productId,
        quantity: 1,
        unit_price: '15.00',
        total_price: '15.00'
      })
      .execute();

    const input: DateRangeInput = {
      start_date: today.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };

    const result = await getSalesReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_sales).toEqual(15);
    expect(result[0].total_transactions).toEqual(1); // Only completed transaction counted
    expect(result[0].total_profit).toEqual(7); // 15 - 8 = 7
  });

  it('should handle date range with no matching transactions', async () => {
    // Create transaction for today
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hash123',
        role: 'cashier'
      })
      .returning()
      .execute();

    await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN001',
        user_id: userResult[0].id,
        total_amount: '10.00',
        discount_amount: '0.00',
        tax_amount: '1.00',
        payment_type: 'cash',
        status: 'completed'
      })
      .execute();

    // Query for future date range
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const input: DateRangeInput = {
      start_date: futureDate.toISOString().split('T')[0],
      end_date: futureDate.toISOString().split('T')[0]
    };

    const result = await getSalesReport(input);
    expect(result).toEqual([]);
  });
});
