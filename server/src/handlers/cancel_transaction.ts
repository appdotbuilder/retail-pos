
import { db } from '../db';
import { transactionsTable, transactionItemsTable, productsTable } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const cancelTransaction = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if transaction exists and is not already cancelled
    const existingTransaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .execute();

    if (existingTransaction.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = existingTransaction[0];
    if (transaction.status === 'cancelled') {
      throw new Error('Transaction is already cancelled');
    }

    // Get all transaction items for stock restoration
    const transactionItems = await db.select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.transaction_id, id))
      .execute();

    // Restore stock quantities for all products in the transaction
    for (const item of transactionItems) {
      await db.update(productsTable)
        .set({
          stock_quantity: sql`${productsTable.stock_quantity} + ${item.quantity}`,
          updated_at: new Date()
        })
        .where(eq(productsTable.id, item.product_id))
        .execute();
    }

    // Update transaction status to cancelled
    await db.update(transactionsTable)
      .set({
        status: 'cancelled',
        updated_at: new Date()
      })
      .where(eq(transactionsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Transaction cancellation failed:', error);
    throw error;
  }
};
