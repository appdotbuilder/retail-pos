
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable } from '../db/schema';
import { type CreateUserInput, type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

// Test data
const testUser: CreateUserInput = {
  username: 'testcashier',
  email: 'cashier@test.com',
  password: 'password123',
  role: 'cashier'
};

const testTransactionWithCustomer: CreateTransactionInput = {
  customer_id: 1,
  user_id: 1,
  total_amount: 99.99,
  discount_amount: 5.00,
  tax_amount: 8.50,
  payment_type: 'cash',
  notes: 'Test transaction with customer'
};

const testTransactionWithoutCustomer: CreateTransactionInput = {
  customer_id: null,
  user_id: 1,
  total_amount: 49.99,
  discount_amount: 0.00,
  tax_amount: 4.25,
  payment_type: 'card',
  notes: 'Test transaction without customer'
};

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();
    expect(result).toEqual([]);
  });

  it('should fetch all transactions with correct data types', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashed_password_123',
      role: testUser.role
    }).execute();

    // Create test transactions
    await db.insert(transactionsTable).values({
      transaction_number: 'TXN-001',
      customer_id: testTransactionWithCustomer.customer_id,
      user_id: testTransactionWithCustomer.user_id,
      total_amount: testTransactionWithCustomer.total_amount.toString(),
      discount_amount: testTransactionWithCustomer.discount_amount.toString(),
      tax_amount: testTransactionWithCustomer.tax_amount.toString(),
      payment_type: testTransactionWithCustomer.payment_type,
      notes: testTransactionWithCustomer.notes
    }).execute();

    await db.insert(transactionsTable).values({
      transaction_number: 'TXN-002',
      customer_id: testTransactionWithoutCustomer.customer_id,
      user_id: testTransactionWithoutCustomer.user_id,
      total_amount: testTransactionWithoutCustomer.total_amount.toString(),
      discount_amount: testTransactionWithoutCustomer.discount_amount.toString(),
      tax_amount: testTransactionWithoutCustomer.tax_amount.toString(),
      payment_type: testTransactionWithoutCustomer.payment_type,
      notes: testTransactionWithoutCustomer.notes
    }).execute();

    const result = await getTransactions();

    expect(result).toHaveLength(2);

    // Verify numeric conversions
    result.forEach(transaction => {
      expect(typeof transaction.total_amount).toBe('number');
      expect(typeof transaction.discount_amount).toBe('number');
      expect(typeof transaction.tax_amount).toBe('number');
    });

    // Verify first transaction data
    const firstTransaction = result.find(t => t.transaction_number === 'TXN-001');
    expect(firstTransaction).toBeDefined();
    expect(firstTransaction!.total_amount).toEqual(99.99);
    expect(firstTransaction!.discount_amount).toEqual(5.00);
    expect(firstTransaction!.tax_amount).toEqual(8.50);
    expect(firstTransaction!.payment_type).toEqual('cash');
    expect(firstTransaction!.customer_id).toEqual(1);
    expect(firstTransaction!.user_id).toEqual(1);
    expect(firstTransaction!.notes).toEqual('Test transaction with customer');

    // Verify second transaction data
    const secondTransaction = result.find(t => t.transaction_number === 'TXN-002');
    expect(secondTransaction).toBeDefined();
    expect(secondTransaction!.total_amount).toEqual(49.99);
    expect(secondTransaction!.discount_amount).toEqual(0.00);
    expect(secondTransaction!.tax_amount).toEqual(4.25);
    expect(secondTransaction!.payment_type).toEqual('card');
    expect(secondTransaction!.customer_id).toBeNull();
    expect(secondTransaction!.user_id).toEqual(1);
    expect(secondTransaction!.notes).toEqual('Test transaction without customer');
  });

  it('should include required fields in transaction objects', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashed_password_123',
      role: testUser.role
    }).execute();

    // Create a single transaction
    await db.insert(transactionsTable).values({
      transaction_number: 'TXN-TEST',
      customer_id: null,
      user_id: 1,
      total_amount: '25.50',
      discount_amount: '2.50',
      tax_amount: '2.00',
      payment_type: 'digital_wallet'
    }).execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    const transaction = result[0];

    // Verify all required fields are present
    expect(transaction.id).toBeDefined();
    expect(transaction.transaction_number).toEqual('TXN-TEST');
    expect(transaction.customer_id).toBeNull();
    expect(transaction.user_id).toEqual(1);
    expect(transaction.total_amount).toEqual(25.50);
    expect(transaction.discount_amount).toEqual(2.50);
    expect(transaction.tax_amount).toEqual(2.00);
    expect(transaction.payment_type).toEqual('digital_wallet');
    expect(transaction.status).toEqual('pending'); // Default value
    expect(transaction.notes).toBeNull();
    expect(transaction.created_at).toBeInstanceOf(Date);
    expect(transaction.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple transactions correctly', async () => {
    // Create prerequisite user
    await db.insert(usersTable).values({
      username: testUser.username,
      email: testUser.email,
      password_hash: 'hashed_password_123',
      role: testUser.role
    }).execute();

    // Create multiple transactions with different payment types and statuses
    const transactions = [
      {
        transaction_number: 'TXN-A',
        user_id: 1,
        total_amount: '100.00',
        discount_amount: '10.00',
        tax_amount: '9.00',
        payment_type: 'cash' as const
      },
      {
        transaction_number: 'TXN-B',
        user_id: 1,
        total_amount: '200.00',
        discount_amount: '0.00',
        tax_amount: '18.00',
        payment_type: 'card' as const
      },
      {
        transaction_number: 'TXN-C',
        user_id: 1,
        total_amount: '75.50',
        discount_amount: '5.50',
        tax_amount: '6.30',
        payment_type: 'digital_wallet' as const
      }
    ];

    for (const txn of transactions) {
      await db.insert(transactionsTable).values(txn).execute();
    }

    const result = await getTransactions();

    expect(result).toHaveLength(3);

    // Verify all transactions have correct numeric types and values
    const sortedResults = result.sort((a, b) => a.transaction_number.localeCompare(b.transaction_number));
    
    expect(sortedResults[0].transaction_number).toEqual('TXN-A');
    expect(sortedResults[0].total_amount).toEqual(100.00);
    expect(sortedResults[0].payment_type).toEqual('cash');

    expect(sortedResults[1].transaction_number).toEqual('TXN-B');
    expect(sortedResults[1].total_amount).toEqual(200.00);
    expect(sortedResults[1].payment_type).toEqual('card');

    expect(sortedResults[2].transaction_number).toEqual('TXN-C');
    expect(sortedResults[2].total_amount).toEqual(75.50);
    expect(sortedResults[2].payment_type).toEqual('digital_wallet');
  });
});
