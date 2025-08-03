
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { type CreateCategoryInput, type CreateProductInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing'
};

const testProduct: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  sku: 'TEST-001',
  barcode: '1234567890',
  price: 19.99,
  cost: 10.00,
  stock_quantity: 100,
  min_stock_level: 10,
  category_id: null // Will be set after category creation
};

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a category', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Delete the category
    const result = await deleteCategory(categoryId);
    expect(result.success).toBe(true);

    // Verify category is soft deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory).toHaveLength(1);
    expect(deletedCategory[0].is_active).toBe(false);
    expect(deletedCategory[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when category not found', async () => {
    const nonExistentId = 99999;

    await expect(deleteCategory(nonExistentId))
      .rejects.toThrow(/category not found or already inactive/i);
  });

  it('should throw error when category already inactive', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({ ...testCategory, is_active: false })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/category not found or already inactive/i);
  });

  it('should throw error when category has associated active products', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product associated with the category
    await db.insert(productsTable)
      .values({
        ...testProduct,
        category_id: categoryId,
        price: testProduct.price.toString(),
        cost: testProduct.cost.toString()
      })
      .execute();

    // Try to delete category - should fail
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/cannot delete category with associated active products/i);

    // Verify category is still active
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(category[0].is_active).toBe(true);
  });

  it('should successfully delete category when products are inactive', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create inactive product associated with the category
    await db.insert(productsTable)
      .values({
        ...testProduct,
        category_id: categoryId,
        price: testProduct.price.toString(),
        cost: testProduct.cost.toString(),
        is_active: false
      })
      .execute();

    // Delete category - should succeed since product is inactive
    const result = await deleteCategory(categoryId);
    expect(result.success).toBe(true);

    // Verify category is soft deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory[0].is_active).toBe(false);
  });

  it('should successfully delete category when products have null category_id', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create product with null category_id
    await db.insert(productsTable)
      .values({
        ...testProduct,
        category_id: null,
        price: testProduct.price.toString(),
        cost: testProduct.cost.toString()
      })
      .execute();

    // Delete category - should succeed
    const result = await deleteCategory(categoryId);
    expect(result.success).toBe(true);

    // Verify category is soft deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory[0].is_active).toBe(false);
  });
});
