
import { db } from '../db';
import { transactionItemsTable, transactionsTable, productsTable } from '../db/schema';
import { type CreateTransactionItemInput, type TransactionItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createTransactionItem = async (input: CreateTransactionItemInput): Promise<TransactionItem> => {
  try {
    // Verify transaction exists
    const transaction = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, input.transaction_id))
      .execute();

    if (transaction.length === 0) {
      throw new Error(`Transaction with id ${input.transaction_id} not found`);
    }

    // Verify product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Check if product has sufficient stock
    if (product[0].stock_quantity < input.quantity) {
      throw new Error(`Insufficient stock. Available: ${product[0].stock_quantity}, Requested: ${input.quantity}`);
    }

    // Insert transaction item record
    const result = await db.insert(transactionItemsTable)
      .values({
        transaction_id: input.transaction_id,
        product_id: input.product_id,
        quantity: input.quantity,
        unit_price: input.unit_price.toString(), // Convert number to string for numeric column
        total_price: input.total_price.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transactionItem = result[0];
    return {
      ...transactionItem,
      unit_price: parseFloat(transactionItem.unit_price), // Convert string back to number
      total_price: parseFloat(transactionItem.total_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction item creation failed:', error);
    throw error;
  }
};
