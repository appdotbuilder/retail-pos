
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  categoriesTable, 
  productsTable, 
  transactionsTable, 
  transactionItemsTable 
} from '../db/schema';
import { cancelTransaction } from '../handlers/cancel_transaction';
import { eq } from 'drizzle-orm';

describe('cancelTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should cancel a completed transaction', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'admin'
    }).returning().execute();

    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'Test category description'
    }).returning().execute();

    const productResult = await db.insert(productsTable).values({
      name: 'Test Product',
      description: 'Test product description',
      sku: 'TEST001',
      price: '19.99',
      cost: '10.00',
      stock_quantity: 100,
      min_stock_level: 10,
      category_id: categoryResult[0].id
    }).returning().execute();

    // Create a completed transaction
    const transactionResult = await db.insert(transactionsTable).values({
      transaction_number: 'TXN001',
      user_id: userResult[0].id,
      total_amount: '39.98',
      discount_amount: '0.00',
      tax_amount: '0.00',
      payment_type: 'cash',
      status: 'completed'
    }).returning().execute();

    // Create transaction items
    await db.insert(transactionItemsTable).values({
      transaction_id: transactionResult[0].id,
      product_id: productResult[0].id,
      quantity: 2,
      unit_price: '19.99',
      total_price: '39.98'
    }).execute();

    // Update product stock to simulate completed transaction
    await db.update(productsTable)
      .set({ stock_quantity: 98 })
      .where(eq(productsTable.id, productResult[0].id))
      .execute();

    const result = await cancelTransaction(transactionResult[0].id);

    expect(result.success).toBe(true);

    // Verify transaction status is updated
    const updatedTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionResult[0].id))
      .execute();

    expect(updatedTransaction[0].status).toBe('cancelled');
    expect(updatedTransaction[0].updated_at).toBeInstanceOf(Date);

    // Verify stock quantity is restored
    const updatedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productResult[0].id))
      .execute();

    expect(updatedProduct[0].stock_quantity).toBe(100); // 98 + 2 = 100
  });

  it('should throw error for non-existent transaction', async () => {
    expect(cancelTransaction(999)).rejects.toThrow(/not found/i);
  });

  it('should throw error for already cancelled transaction', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'admin'
    }).returning().execute();

    // Create a cancelled transaction
    const transactionResult = await db.insert(transactionsTable).values({
      transaction_number: 'TXN002',
      user_id: userResult[0].id,
      total_amount: '19.99',
      discount_amount: '0.00',
      tax_amount: '0.00',
      payment_type: 'cash',
      status: 'cancelled'
    }).returning().execute();

    expect(cancelTransaction(transactionResult[0].id)).rejects.toThrow(/already cancelled/i);
  });

  it('should restore stock for multiple products', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      role: 'admin'
    }).returning().execute();

    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'Test category description'
    }).returning().execute();

    const product1Result = await db.insert(productsTable).values({
      name: 'Product 1',
      description: 'First product',
      sku: 'PROD001',
      price: '10.00',
      cost: '5.00',
      stock_quantity: 48, // Simulated after transaction
      min_stock_level: 5,
      category_id: categoryResult[0].id
    }).returning().execute();

    const product2Result = await db.insert(productsTable).values({
      name: 'Product 2',
      description: 'Second product',
      sku: 'PROD002',
      price: '15.00',
      cost: '8.00',
      stock_quantity: 77, // Simulated after transaction
      min_stock_level: 10,
      category_id: categoryResult[0].id
    }).returning().execute();

    // Create transaction with multiple items
    const transactionResult = await db.insert(transactionsTable).values({
      transaction_number: 'TXN003',
      user_id: userResult[0].id,
      total_amount: '65.00',
      discount_amount: '0.00',
      tax_amount: '0.00',
      payment_type: 'card',
      status: 'completed'
    }).returning().execute();

    // Create multiple transaction items
    await db.insert(transactionItemsTable).values([
      {
        transaction_id: transactionResult[0].id,
        product_id: product1Result[0].id,
        quantity: 2,
        unit_price: '10.00',
        total_price: '20.00'
      },
      {
        transaction_id: transactionResult[0].id,
        product_id: product2Result[0].id,
        quantity: 3,
        unit_price: '15.00',
        total_price: '45.00'
      }
    ]).execute();

    const result = await cancelTransaction(transactionResult[0].id);

    expect(result.success).toBe(true);

    // Verify both products have restored stock
    const updatedProduct1 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product1Result[0].id))
      .execute();

    const updatedProduct2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product2Result[0].id))
      .execute();

    expect(updatedProduct1[0].stock_quantity).toBe(50); // 48 + 2 = 50
    expect(updatedProduct2[0].stock_quantity).toBe(80); // 77 + 3 = 80
  });
});
