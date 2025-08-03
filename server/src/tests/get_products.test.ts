
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

// Test product data
const testProduct1: CreateProductInput = {
  name: 'Test Product 1',
  description: 'First test product',
  sku: 'TEST001',
  barcode: '1234567890',
  price: 19.99,
  cost: 10.50,
  stock_quantity: 100,
  min_stock_level: 10,
  category_id: null
};

const testProduct2: CreateProductInput = {
  name: 'Test Product 2',
  description: 'Second test product',
  sku: 'TEST002',
  barcode: null,
  price: 29.99,
  cost: 15.00,
  stock_quantity: 50,
  min_stock_level: 5,
  category_id: null
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return all active products', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        ...testProduct1,
        price: testProduct1.price.toString(),
        cost: testProduct1.cost.toString()
      },
      {
        ...testProduct2,
        price: testProduct2.price.toString(),
        cost: testProduct2.cost.toString()
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);

    // Verify first product
    const product1 = result.find(p => p.sku === 'TEST001');
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.description).toEqual('First test product');
    expect(product1!.price).toEqual(19.99);
    expect(typeof product1!.price).toBe('number');
    expect(product1!.cost).toEqual(10.50);
    expect(typeof product1!.cost).toBe('number');
    expect(product1!.stock_quantity).toEqual(100);
    expect(product1!.min_stock_level).toEqual(10);
    expect(product1!.is_active).toBe(true);
    expect(product1!.created_at).toBeInstanceOf(Date);

    // Verify second product
    const product2 = result.find(p => p.sku === 'TEST002');
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.price).toEqual(29.99);
    expect(product2!.cost).toEqual(15.00);
  });

  it('should not return inactive products', async () => {
    // Insert active and inactive products
    await db.insert(productsTable).values([
      {
        ...testProduct1,
        price: testProduct1.price.toString(),
        cost: testProduct1.cost.toString(),
        is_active: true
      },
      {
        ...testProduct2,
        price: testProduct2.price.toString(),
        cost: testProduct2.cost.toString(),
        is_active: false
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].sku).toEqual('TEST001');
    expect(result[0].is_active).toBe(true);
  });

  it('should handle products with category_id', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'A test category'
    }).returning().execute();

    const category = categoryResult[0];

    // Insert product with category
    await db.insert(productsTable).values({
      ...testProduct1,
      price: testProduct1.price.toString(),
      cost: testProduct1.cost.toString(),
      category_id: category.id
    }).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].category_id).toEqual(category.id);
  });

  it('should handle products with null optional fields', async () => {
    // Insert product with minimal required fields
    await db.insert(productsTable).values({
      name: 'Minimal Product',
      description: null,
      sku: 'MIN001',
      barcode: null,
      price: '5.99',
      cost: '3.00',
      stock_quantity: 1,
      min_stock_level: 0,
      category_id: null
    }).execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Product');
    expect(result[0].description).toBeNull();
    expect(result[0].barcode).toBeNull();
    expect(result[0].category_id).toBeNull();
    expect(result[0].price).toEqual(5.99);
    expect(result[0].cost).toEqual(3.00);
  });
});
