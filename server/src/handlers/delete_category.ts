
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export const deleteCategory = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Check if category exists and is active
    const category = await db.select()
      .from(categoriesTable)
      .where(and(eq(categoriesTable.id, id), eq(categoriesTable.is_active, true)))
      .execute();

    if (category.length === 0) {
      throw new Error('Category not found or already inactive');
    }

    // Check if category has associated active products
    const productsWithCategory = await db.select()
      .from(productsTable)
      .where(and(
        eq(productsTable.category_id, id),
        eq(productsTable.is_active, true),
        isNotNull(productsTable.category_id)
      ))
      .execute();

    if (productsWithCategory.length > 0) {
      throw new Error('Cannot delete category with associated active products');
    }

    // Soft delete by setting is_active to false
    await db.update(categoriesTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(categoriesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};
