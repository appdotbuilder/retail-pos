
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    // Fetch all transactions - no joins needed for basic transaction data
    const results = await db.select()
      .from(transactionsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(transaction => ({
      ...transaction,
      total_amount: parseFloat(transaction.total_amount),
      discount_amount: parseFloat(transaction.discount_amount),
      tax_amount: parseFloat(transaction.tax_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
};
