
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Fetch all active products from the database
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price),
      cost: parseFloat(product.cost)
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};
