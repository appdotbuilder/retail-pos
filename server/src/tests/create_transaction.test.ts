
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable, customersTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testCustomerId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testcashier',
        email: 'cashier@test.com',
        password_hash: 'hashedpassword',
        role: 'cashier'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create prerequisite customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '1234567890'
      })
      .returning()
      .execute();
    testCustomerId = customerResult[0].id;
  });

  const testInput: CreateTransactionInput = {
    customer_id: 0, // Will be set in beforeEach
    user_id: 0, // Will be set in beforeEach
    total_amount: 99.99,
    discount_amount: 5.00,
    tax_amount: 7.50,
    payment_type: 'cash',
    notes: 'Test transaction'
  };

  it('should create a transaction with customer', async () => {
    const input = {
      ...testInput,
      customer_id: testCustomerId,
      user_id: testUserId
    };

    const result = await createTransaction(input);

    // Basic field validation
    expect(result.customer_id).toEqual(testCustomerId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.total_amount).toEqual(99.99);
    expect(result.discount_amount).toEqual(5.00);
    expect(result.tax_amount).toEqual(7.50);
    expect(result.payment_type).toEqual('cash');
    expect(result.status).toEqual('completed');
    expect(result.notes).toEqual('Test transaction');
    expect(result.id).toBeDefined();
    expect(result.transaction_number).toBeDefined();
    expect(result.transaction_number).toMatch(/^TXN-\d+-[a-z0-9]+$/);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.total_amount).toBe('number');
    expect(typeof result.discount_amount).toBe('number');
    expect(typeof result.tax_amount).toBe('number');
  });

  it('should create a transaction without customer', async () => {
    const input = {
      ...testInput,
      customer_id: null,
      user_id: testUserId
    };

    const result = await createTransaction(input);

    expect(result.customer_id).toBeNull();
    expect(result.user_id).toEqual(testUserId);
    expect(result.total_amount).toEqual(99.99);
    expect(result.status).toEqual('completed');
  });

  it('should save transaction to database', async () => {
    const input = {
      ...testInput,
      customer_id: testCustomerId,
      user_id: testUserId
    };

    const result = await createTransaction(input);

    // Query using proper drizzle syntax
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const savedTransaction = transactions[0];
    expect(savedTransaction.customer_id).toEqual(testCustomerId);
    expect(savedTransaction.user_id).toEqual(testUserId);
    expect(parseFloat(savedTransaction.total_amount)).toEqual(99.99);
    expect(parseFloat(savedTransaction.discount_amount)).toEqual(5.00);
    expect(parseFloat(savedTransaction.tax_amount)).toEqual(7.50);
    expect(savedTransaction.payment_type).toEqual('cash');
    expect(savedTransaction.status).toEqual('completed');
    expect(savedTransaction.notes).toEqual('Test transaction');
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
  });

  it('should generate unique transaction numbers', async () => {
    const input = {
      ...testInput,
      customer_id: testCustomerId,
      user_id: testUserId
    };

    const result1 = await createTransaction(input);
    const result2 = await createTransaction(input);

    expect(result1.transaction_number).not.toEqual(result2.transaction_number);
    expect(result1.transaction_number).toMatch(/^TXN-\d+-[a-z0-9]+$/);
    expect(result2.transaction_number).toMatch(/^TXN-\d+-[a-z0-9]+$/);
  });

  it('should handle different payment types', async () => {
    const paymentTypes = ['cash', 'card', 'digital_wallet', 'bank_transfer'] as const;

    for (const paymentType of paymentTypes) {
      const input = {
        ...testInput,
        customer_id: testCustomerId,
        user_id: testUserId,
        payment_type: paymentType
      };

      const result = await createTransaction(input);
      expect(result.payment_type).toEqual(paymentType);
    }
  });

  it('should handle zero discount and tax amounts', async () => {
    const input = {
      ...testInput,
      customer_id: testCustomerId,
      user_id: testUserId,
      discount_amount: 0,
      tax_amount: 0
    };

    const result = await createTransaction(input);

    expect(result.discount_amount).toEqual(0);
    expect(result.tax_amount).toEqual(0);
    expect(typeof result.discount_amount).toBe('number');
    expect(typeof result.tax_amount).toBe('number');
  });
});
