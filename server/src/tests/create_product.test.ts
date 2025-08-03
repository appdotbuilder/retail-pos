
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  sku: 'TEST-001',
  barcode: '1234567890123',
  price: 19.99,
  cost: 10.50,
  stock_quantity: 100,
  min_stock_level: 10,
  category_id: null
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Verify all field values and types
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.sku).toEqual('TEST-001');
    expect(result.barcode).toEqual('1234567890123');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.cost).toEqual(10.50);
    expect(typeof result.cost).toEqual('number');
    expect(result.stock_quantity).toEqual(100);
    expect(result.min_stock_level).toEqual(10);
    expect(result.category_id).toBeNull();
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query database to verify product was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Product');
    expect(savedProduct.sku).toEqual('TEST-001');
    expect(parseFloat(savedProduct.price)).toEqual(19.99);
    expect(parseFloat(savedProduct.cost)).toEqual(10.50);
    expect(savedProduct.stock_quantity).toEqual(100);
    expect(savedProduct.is_active).toBe(true);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
  });

  it('should create product with valid category_id', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create product with category
    const inputWithCategory = {
      ...testInput,
      category_id: category.id
    };

    const result = await createProduct(inputWithCategory);

    expect(result.category_id).toEqual(category.id);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].category_id).toEqual(category.id);
  });

  it('should handle null optional fields', async () => {
    const minimalInput: CreateProductInput = {
      name: 'Minimal Product',
      sku: 'MIN-001',
      price: 5.00,
      cost: 2.50,
      stock_quantity: 50,
      min_stock_level: 5
    };

    const result = await createProduct(minimalInput);

    expect(result.description).toBeNull();
    expect(result.barcode).toBeNull();
    expect(result.category_id).toBeNull();
    expect(result.name).toEqual('Minimal Product');
    expect(result.price).toEqual(5.00);
  });

  it('should reject duplicate SKU', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create another product with same SKU
    const duplicateInput = {
      ...testInput,
      name: 'Duplicate Product'
    };

    await expect(createProduct(duplicateInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should reject invalid category_id', async () => {
    const inputWithInvalidCategory = {
      ...testInput,
      category_id: 99999 // Non-existent category
    };

    await expect(createProduct(inputWithInvalidCategory))
      .rejects.toThrow(/does not exist/i);
  });
});
