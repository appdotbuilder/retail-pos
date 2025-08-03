
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable, usersTable, customersTable } from '../db/schema';
import { getDailyRevenue } from '../handlers/get_daily_revenue';
import { type CreateTransactionInput } from '../schema';

describe('getDailyRevenue', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero revenue when no completed transactions exist', async () => {
    const result = await getDailyRevenue('2024-01-15');

    expect(result.revenue).toEqual(0);
    expect(result.date).toEqual('2024-01-15');
  });

  it('should calculate revenue for completed transactions only', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'cashier'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create transactions with different statuses on the same date
    await db.insert(transactionsTable)
      .values([
        {
          transaction_number: 'T001',
          user_id: userId,
          total_amount: '100.50',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          transaction_number: 'T002',
          user_id: userId,
          total_amount: '75.25',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'card',
          status: 'completed',
          created_at: new Date('2024-01-15T14:30:00Z')
        },
        {
          transaction_number: 'T003',
          user_id: userId,
          total_amount: '50.00',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'cash',
          status: 'pending',
          created_at: new Date('2024-01-15T16:00:00Z')
        },
        {
          transaction_number: 'T004',
          user_id: userId,
          total_amount: '25.75',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'card',
          status: 'cancelled',
          created_at: new Date('2024-01-15T18:00:00Z')
        }
      ])
      .execute();

    const result = await getDailyRevenue('2024-01-15');

    // Should only sum completed transactions: 100.50 + 75.25 = 175.75
    expect(result.revenue).toEqual(175.75);
    expect(result.date).toEqual('2024-01-15');
  });

  it('should filter by date correctly and exclude other dates', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'cashier'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create transactions on different dates
    await db.insert(transactionsTable)
      .values([
        {
          transaction_number: 'T001',
          user_id: userId,
          total_amount: '100.00',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          transaction_number: 'T002',
          user_id: userId,
          total_amount: '200.00',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'card',
          status: 'completed',
          created_at: new Date('2024-01-16T10:00:00Z')
        },
        {
          transaction_number: 'T003',
          user_id: userId,
          total_amount: '300.00',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-14T10:00:00Z')
        }
      ])
      .execute();

    const result = await getDailyRevenue('2024-01-15');

    // Should only include transaction from 2024-01-15
    expect(result.revenue).toEqual(100);
    expect(result.date).toEqual('2024-01-15');
  });

  it('should use current date when no date parameter provided', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await getDailyRevenue();

    expect(result.date).toEqual(today);
    expect(typeof result.revenue).toBe('number');
  });

  it('should handle decimal amounts correctly', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed',
        role: 'cashier'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create transactions with decimal amounts
    await db.insert(transactionsTable)
      .values([
        {
          transaction_number: 'T001',
          user_id: userId,
          total_amount: '99.99',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'cash',
          status: 'completed',
          created_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          transaction_number: 'T002',
          user_id: userId,
          total_amount: '0.01',
          discount_amount: '0',
          tax_amount: '0',
          payment_type: 'card',
          status: 'completed',
          created_at: new Date('2024-01-15T14:30:00Z')
        }
      ])
      .execute();

    const result = await getDailyRevenue('2024-01-15');

    expect(result.revenue).toEqual(100);
    expect(result.date).toEqual('2024-01-15');
  });
});
