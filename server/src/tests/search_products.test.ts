
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { searchProducts } from '../handlers/search_products';

describe('searchProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const setupTestProducts = async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Samsung Galaxy Phone',
          description: 'Latest Samsung smartphone',
          sku: 'SAM-001',
          barcode: '1234567890123',
          price: '799.99',
          cost: '500.00',
          stock_quantity: 10,
          min_stock_level: 2,
          category_id: categoryId,
          is_active: true
        },
        {
          name: 'Apple iPhone',
          description: 'Latest iPhone model',
          sku: 'APL-001',
          barcode: '9876543210987',
          price: '999.99',
          cost: '600.00',
          stock_quantity: 5,
          min_stock_level: 1,
          category_id: categoryId,
          is_active: true
        },
        {
          name: 'Old Nokia Phone',
          description: 'Discontinued phone',
          sku: 'NOK-001',
          barcode: '5555555555555',
          price: '99.99',
          cost: '50.00',
          stock_quantity: 0,
          min_stock_level: 0,
          category_id: categoryId,
          is_active: false // Inactive product
        },
        {
          name: 'Wireless Headphones',
          description: 'Bluetooth headphones',
          sku: 'WH-001',
          barcode: null, // Product without barcode
          price: '149.99',
          cost: '75.00',
          stock_quantity: 20,
          min_stock_level: 5,
          category_id: categoryId,
          is_active: true
        }
      ])
      .execute();
  };

  it('should return empty array for empty query', async () => {
    await setupTestProducts();
    
    const result = await searchProducts('');
    expect(result).toHaveLength(0);

    const result2 = await searchProducts('   ');
    expect(result2).toHaveLength(0);
  });

  it('should search products by name (case-insensitive)', async () => {
    await setupTestProducts();

    const result = await searchProducts('samsung');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Samsung Galaxy Phone');
    expect(result[0].sku).toBe('SAM-001');
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toBe(799.99);

    // Test case-insensitive search
    const result2 = await searchProducts('SAMSUNG');
    expect(result2).toHaveLength(1);
    expect(result2[0].name).toBe('Samsung Galaxy Phone');

    // Test partial name match - "phone" matches Samsung Galaxy Phone, Apple iPhone, and Wireless Headphones
    const result3 = await searchProducts('phone');
    expect(result3).toHaveLength(3); // Samsung Galaxy Phone, Apple iPhone, and Wireless Headphones (Nokia is inactive)
    const names = result3.map(p => p.name);
    expect(names).toContain('Samsung Galaxy Phone');
    expect(names).toContain('Apple iPhone');
    expect(names).toContain('Wireless Headphones');
  });

  it('should search products by exact SKU', async () => {
    await setupTestProducts();

    const result = await searchProducts('SAM-001');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Samsung Galaxy Phone');
    expect(result[0].sku).toBe('SAM-001');
    expect(typeof result[0].cost).toBe('number');
    expect(result[0].cost).toBe(500.00);

    // Partial SKU should match by name search (SAM is in Samsung)
    const result2 = await searchProducts('SAM');
    expect(result2).toHaveLength(1);
    expect(result2[0].name).toBe('Samsung Galaxy Phone');
  });

  it('should search products by exact barcode', async () => {
    await setupTestProducts();

    const result = await searchProducts('1234567890123');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Samsung Galaxy Phone');
    expect(result[0].barcode).toBe('1234567890123');

    // Partial barcode should not match
    const result2 = await searchProducts('123456');
    expect(result2).toHaveLength(0);
  });

  it('should only return active products', async () => {
    await setupTestProducts();

    // Search for Nokia which is inactive
    const result = await searchProducts('Nokia');
    expect(result).toHaveLength(0);

    // Search by inactive product's SKU
    const result2 = await searchProducts('NOK-001');
    expect(result2).toHaveLength(0);

    // Search by inactive product's barcode
    const result3 = await searchProducts('5555555555555');
    expect(result3).toHaveLength(0);
  });

  it('should return empty array when no products match', async () => {
    await setupTestProducts();

    const result = await searchProducts('nonexistent');
    expect(result).toHaveLength(0);

    const result2 = await searchProducts('XXX-999');
    expect(result2).toHaveLength(0);

    const result3 = await searchProducts('0000000000000');
    expect(result3).toHaveLength(0);
  });

  it('should handle products with null barcode', async () => {
    await setupTestProducts();

    // Search for product with null barcode by name
    const result = await searchProducts('Wireless');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wireless Headphones');
    expect(result[0].barcode).toBeNull();
  });

  it('should trim whitespace from query', async () => {
    await setupTestProducts();

    const result = await searchProducts('  SAM-001  ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Samsung Galaxy Phone');
  });

  it('should return all matching products for broader searches', async () => {
    await setupTestProducts();

    // Search for "Apple" - should match iPhone
    const result = await searchProducts('Apple');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Apple iPhone');

    // Search for a term that matches multiple products
    const result2 = await searchProducts('phone');
    expect(result2.length).toBeGreaterThan(1);
    
    // Verify all returned products are active
    result2.forEach(product => {
      expect(product.is_active).toBe(true);
    });
  });

  it('should convert numeric fields correctly', async () => {
    await setupTestProducts();

    const result = await searchProducts('samsung');
    expect(result).toHaveLength(1);
    
    const product = result[0];
    expect(typeof product.price).toBe('number');
    expect(typeof product.cost).toBe('number');
    expect(typeof product.stock_quantity).toBe('number');
    expect(typeof product.min_stock_level).toBe('number');
    
    expect(product.price).toBe(799.99);
    expect(product.cost).toBe(500.00);
    expect(product.stock_quantity).toBe(10);
    expect(product.min_stock_level).toBe(2);
  });

  it('should differentiate between exact SKU/barcode and name search', async () => {
    await setupTestProducts();

    // Test that exact SKU match works
    const skuResult = await searchProducts('WH-001');
    expect(skuResult).toHaveLength(1);
    expect(skuResult[0].sku).toBe('WH-001');

    // Test that exact barcode match works
    const barcodeResult = await searchProducts('9876543210987');
    expect(barcodeResult).toHaveLength(1);
    expect(barcodeResult[0].barcode).toBe('9876543210987');

    // Test that name search is case-insensitive and partial
    const nameResult = await searchProducts('galaxy');
    expect(nameResult).toHaveLength(1);
    expect(nameResult[0].name).toBe('Samsung Galaxy Phone');
  });
});
