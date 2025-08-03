
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product directly in database
  const createTestProduct = async (overrides: any = {}) => {
    const defaultData = {
      name: 'Test Product',
      description: 'Test description',
      sku: 'TEST-001',
      barcode: '123456789',
      price: '10.99',
      cost: '5.50',
      stock_quantity: 50,
      min_stock_level: 10,
      category_id: null,
      is_active: true,
      ...overrides
    };

    const result = await db.insert(productsTable)
      .values(defaultData)
      .returning()
      .execute();

    return result[0];
  };

  // Helper function to create a test category directly in database
  const createTestCategory = async () => {
    const result = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products',
        is_active: true
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should update a product with all fields', async () => {
    // Create initial product
    const createdProduct = await createTestProduct({
      name: 'Original Product',
      description: 'Original description',
      sku: 'ORIG-001',
      barcode: '123456789',
      price: '10.99',
      cost: '5.50',
      stock_quantity: 50,
      min_stock_level: 10
    });

    // Update with new values
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Updated Product',
      description: 'Updated description',
      sku: 'UPD-001',
      barcode: '987654321',
      price: 15.99,
      cost: 8.00,
      stock_quantity: 75,
      min_stock_level: 15,
      is_active: false
    };

    const result = await updateProduct(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdProduct.id);
    expect(result.name).toEqual('Updated Product');
    expect(result.description).toEqual('Updated description');
    expect(result.sku).toEqual('UPD-001');
    expect(result.barcode).toEqual('987654321');
    expect(result.price).toEqual(15.99);
    expect(result.cost).toEqual(8.00);
    expect(result.stock_quantity).toEqual(75);
    expect(result.min_stock_level).toEqual(15);
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdProduct.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create initial product
    const createdProduct = await createTestProduct({
      name: 'Original Product',
      description: 'Original description',
      sku: 'ORIG-002',
      barcode: null,
      price: '20.00',
      cost: '10.00',
      stock_quantity: 100,
      min_stock_level: 20
    });

    // Update only name and price
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Partially Updated Product',
      price: 25.00
    };

    const result = await updateProduct(updateInput);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Partially Updated Product');
    expect(result.price).toEqual(25.00);
    // Other fields should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.sku).toEqual('ORIG-002');
    expect(result.cost).toEqual(10.00);
    expect(result.stock_quantity).toEqual(100);
    expect(result.min_stock_level).toEqual(20);
    expect(result.is_active).toBe(true);
  });

  it('should update category_id to valid category', async () => {
    // Create category first
    const category = await createTestCategory();

    // Create product without category
    const createdProduct = await createTestProduct({
      name: 'Product Without Category',
      description: null,
      sku: 'NO-CAT-001',
      barcode: null,
      price: '99.99',
      cost: '50.00',
      stock_quantity: 25,
      min_stock_level: 5,
      category_id: null
    });

    // Update to assign category
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      category_id: category.id
    };

    const result = await updateProduct(updateInput);

    expect(result.category_id).toEqual(category.id);
    expect(result.name).toEqual('Product Without Category'); // Other fields unchanged
  });

  it('should save updated product to database', async () => {
    // Create initial product
    const createdProduct = await createTestProduct({
      name: 'Database Test Product',
      description: 'Test description',
      sku: 'DB-TEST-001',
      barcode: null,
      price: '30.00',
      cost: '15.00',
      stock_quantity: 40,
      min_stock_level: 8
    });

    // Update product
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Updated Database Test Product',
      price: 35.00,
      stock_quantity: 45
    };

    await updateProduct(updateInput);

    // Verify changes in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();

    expect(products).toHaveLength(1);
    const dbProduct = products[0];
    expect(dbProduct.name).toEqual('Updated Database Test Product');
    expect(parseFloat(dbProduct.price)).toEqual(35.00);
    expect(dbProduct.stock_quantity).toEqual(45);
    // Unchanged fields
    expect(dbProduct.description).toEqual('Test description');
    expect(parseFloat(dbProduct.cost)).toEqual(15.00);
  });

  it('should handle null values correctly', async () => {
    // Create product with non-null optional fields
    const createdProduct = await createTestProduct({
      name: 'Product With Values',
      description: 'Has description',
      sku: 'NULL-TEST-001',
      barcode: '111222333',
      price: '40.00',
      cost: '20.00',
      stock_quantity: 60,
      min_stock_level: 12
    });

    // Update to set nullable fields to null
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      description: null,
      barcode: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.barcode).toBeNull();
    expect(result.name).toEqual('Product With Values'); // Other fields unchanged
  });

  it('should throw error when product not found', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric type conversions correctly', async () => {
    // Create product
    const createdProduct = await createTestProduct({
      price: '12.34',
      cost: '6.78'
    });

    // Update with numeric values
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      price: 45.67,
      cost: 23.89
    };

    const result = await updateProduct(updateInput);

    // Verify numeric fields are returned as numbers
    expect(typeof result.price).toBe('number');
    expect(typeof result.cost).toBe('number');
    expect(result.price).toEqual(45.67);
    expect(result.cost).toEqual(23.89);
  });
});
