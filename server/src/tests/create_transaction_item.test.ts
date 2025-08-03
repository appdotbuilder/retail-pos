
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionItemsTable, usersTable, productsTable, transactionsTable, categoriesTable } from '../db/schema';
import { type CreateTransactionItemInput } from '../schema';
import { createTransactionItem } from '../handlers/create_transaction_item';
import { eq } from 'drizzle-orm';

describe('createTransactionItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;
  let testTransactionId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A product for testing',
        sku: 'TEST-001',
        barcode: '1234567890',
        price: '19.99',
        cost: '10.00',
        stock_quantity: 100,
        min_stock_level: 5,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create test transaction
    const transactionResult = await db.insert(transactionsTable)
      .values({
        transaction_number: 'TXN-001',
        user_id: testUserId,
        total_amount: '59.97',
        discount_amount: '0.00',
        tax_amount: '5.40',
        payment_type: 'cash',
        status: 'pending'
      })
      .returning()
      .execute();
    testTransactionId = transactionResult[0].id;
  });

  const testInput: CreateTransactionItemInput = {
    transaction_id: 0, // Will be set in tests
    product_id: 0, // Will be set in tests
    quantity: 3,
    unit_price: 19.99,
    total_price: 59.97
  };

  it('should create a transaction item', async () => {
    const input = {
      ...testInput,
      transaction_id: testTransactionId,
      product_id: testProductId
    };

    const result = await createTransactionItem(input);

    // Basic field validation
    expect(result.transaction_id).toEqual(testTransactionId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.quantity).toEqual(3);
    expect(result.unit_price).toEqual(19.99);
    expect(result.total_price).toEqual(59.97);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save transaction item to database', async () => {
    const input = {
      ...testInput,
      transaction_id: testTransactionId,
      product_id: testProductId
    };

    const result = await createTransactionItem(input);

    // Query the database to verify the item was saved
    const items = await db.select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].transaction_id).toEqual(testTransactionId);
    expect(items[0].product_id).toEqual(testProductId);
    expect(items[0].quantity).toEqual(3);
    expect(parseFloat(items[0].unit_price)).toEqual(19.99);
    expect(parseFloat(items[0].total_price)).toEqual(59.97);
    expect(items[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when transaction does not exist', async () => {
    const input = {
      ...testInput,
      transaction_id: 99999, // Non-existent transaction ID
      product_id: testProductId
    };

    await expect(createTransactionItem(input))
      .rejects.toThrow(/transaction with id 99999 not found/i);
  });

  it('should throw error when product does not exist', async () => {
    const input = {
      ...testInput,
      transaction_id: testTransactionId,
      product_id: 99999 // Non-existent product ID
    };

    await expect(createTransactionItem(input))
      .rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should throw error when insufficient stock', async () => {
    const input = {
      ...testInput,
      transaction_id: testTransactionId,
      product_id: testProductId,
      quantity: 150 // More than available stock (100)
    };

    await expect(createTransactionItem(input))
      .rejects.toThrow(/insufficient stock.*available: 100.*requested: 150/i);
  });

  it('should handle numeric precision correctly', async () => {
    const input = {
      transaction_id: testTransactionId,
      product_id: testProductId,
      quantity: 1,
      unit_price: 12.34, // Use 2 decimal places to match PostgreSQL numeric(10,2)
      total_price: 12.34
    };

    const result = await createTransactionItem(input);

    expect(typeof result.unit_price).toBe('number');
    expect(typeof result.total_price).toBe('number');
    expect(result.unit_price).toEqual(12.34);
    expect(result.total_price).toEqual(12.34);
  });
});
