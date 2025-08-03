
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { or, ilike, eq, and } from 'drizzle-orm';

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    // If query is empty, return empty array
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim();

    // Search active products by name (case-insensitive), SKU (exact), or barcode (exact)
    const results = await db.select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.is_active, true),
          or(
            ilike(productsTable.name, `%${trimmedQuery}%`),
            eq(productsTable.sku, trimmedQuery),
            eq(productsTable.barcode, trimmedQuery)
          )
        )
      )
      .execute();

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price),
      cost: parseFloat(product.cost)
    }));
  } catch (error) {
    console.error('Product search failed:', error);
    throw error;
  }
};
