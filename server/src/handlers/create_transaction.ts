
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Generate unique transaction number
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        transaction_number: transactionNumber,
        customer_id: input.customer_id || null,
        user_id: input.user_id,
        total_amount: input.total_amount.toString(), // Convert number to string for numeric column
        discount_amount: input.discount_amount.toString(), // Convert number to string for numeric column
        tax_amount: input.tax_amount.toString(), // Convert number to string for numeric column
        payment_type: input.payment_type,
        status: 'completed',
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      total_amount: parseFloat(transaction.total_amount), // Convert string back to number
      discount_amount: parseFloat(transaction.discount_amount), // Convert string back to number
      tax_amount: parseFloat(transaction.tax_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};
