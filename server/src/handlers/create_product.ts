
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Validate that category exists if provided
    if (input.category_id) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();
      
      if (categoryExists.length === 0) {
        throw new Error(`Category with ID ${input.category_id} does not exist`);
      }
    }

    // Check if SKU already exists
    const existingSku = await db.select()
      .from(productsTable)
      .where(eq(productsTable.sku, input.sku))
      .execute();
    
    if (existingSku.length > 0) {
      throw new Error(`Product with SKU '${input.sku}' already exists`);
    }

    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        description: input.description || null,
        sku: input.sku,
        barcode: input.barcode || null,
        price: input.price.toString(), // Convert number to string for numeric column
        cost: input.cost.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity,
        min_stock_level: input.min_stock_level,
        category_id: input.category_id || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price), // Convert string back to number
      cost: parseFloat(product.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
