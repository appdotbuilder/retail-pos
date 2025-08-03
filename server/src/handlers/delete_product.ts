
import { db } from '../db';
import { productsTable, transactionItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1)
      .execute();

    if (existingProduct.length === 0) {
      throw new Error('Product not found');
    }

    // Check if product is used in any transactions
    const transactionItems = await db.select()
      .from(transactionItemsTable)
      .where(eq(transactionItemsTable.product_id, id))
      .limit(1)
      .execute();

    if (transactionItems.length > 0) {
      throw new Error('Cannot delete product that has been used in transactions');
    }

    // Soft delete by setting is_active to false
    await db.update(productsTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
