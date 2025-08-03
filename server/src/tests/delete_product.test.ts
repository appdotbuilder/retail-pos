
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable, usersTable, transactionsTable, transactionItemsTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';
import { type CreateProductInput, type CreateCategoryInput, type CreateUserInput, type CreateTransactionInput, type CreateTransactionItemInput } from '../schema';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a product by setting is_active to false', async () => {
    // Create category first
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      description: 'Category for testing'
    };

    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();

    // Create product
    const productInput: CreateProductInput = {
      name: 'Test Product',
      description: 'A product for testing',
      sku: 'TEST-001',
      barcode: '123456789',
      price: 19.99,
      cost: 10.00,
      stock_quantity: 100,
      min_stock_level: 10,
      category_id: categoryResult[0].id
    };

    const productResult = await db.insert(productsTable)
      .values({
        ...productInput,
        price: productInput.price.toString(),
        cost: productInput.cost.toString()
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result.success).toBe(true);

    // Verify product is soft deleted
    const deletedProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(deletedProduct).toHaveLength(1);
    expect(deletedProduct[0].is_active).toBe(false);
    expect(deletedProduct[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteProduct(nonExistentId)).rejects.toThrow(/product not found/i);
  });

  it('should throw error when product is used in transactions', async () => {
    // Create category first
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      description: 'Category for testing'
    };

    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();

    // Create product
    const productInput: CreateProductInput = {
      name: 'Test Product',
      description: 'A product for testing',
      sku: 'TEST-001',
      barcode: '123456789',
      price: 19.99,
      cost: 10.00,
      stock_quantity: 100,
      min_stock_level: 10,
      category_id: categoryResult[0].id
    };

    const productResult = await db.insert(productsTable)
      .values({
        ...productInput,
        price: productInput.price.toString(),
        cost: productInput.cost.toString()
      })
      .returning()
      .execute();

    // Create user
    const userInput: CreateUserInput = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'cashier'
    };

    const userResult = await db.insert(usersTable)
      .values({
        ...userInput,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create transaction
    const transactionInput: CreateTransactionInput = {
      user_id: userResult[0].id,
      total_amount: 19.99,
      discount_amount: 0,
      tax_amount: 0,
      payment_type: 'cash'
    };

    const transactionResult = await db.insert(transactionsTable)
      .values({
        ...transactionInput,
        transaction_number: 'TXN-001',
        total_amount: transactionInput.total_amount.toString(),
        discount_amount: transactionInput.discount_amount.toString(),
        tax_amount: transactionInput.tax_amount.toString()
      })
      .returning()
      .execute();

    // Create transaction item linking product to transaction
    const transactionItemInput: CreateTransactionItemInput = {
      transaction_id: transactionResult[0].id,
      product_id: productResult[0].id,
      quantity: 1,
      unit_price: 19.99,
      total_price: 19.99
    };

    await db.insert(transactionItemsTable)
      .values({
        ...transactionItemInput,
        unit_price: transactionItemInput.unit_price.toString(),
        total_price: transactionItemInput.total_price.toString()
      })
      .execute();

    // Try to delete the product
    await expect(deleteProduct(productResult[0].id)).rejects.toThrow(/cannot delete product that has been used in transactions/i);
  });

  it('should successfully delete product that exists but has no transaction history', async () => {
    // Create category first
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      description: 'Category for testing'
    };

    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();

    // Create product
    const productInput: CreateProductInput = {
      name: 'Test Product',
      description: 'A product for testing',
      sku: 'TEST-001',
      barcode: '123456789',
      price: 19.99,
      cost: 10.00,
      stock_quantity: 100,
      min_stock_level: 10,
      category_id: categoryResult[0].id
    };

    const productResult = await db.insert(productsTable)
      .values({
        ...productInput,
        price: productInput.price.toString(),
        cost: productInput.cost.toString()
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Verify product starts as active
    const activeProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(activeProduct[0].is_active).toBe(true);

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result.success).toBe(true);

    // Verify product is now inactive
    const inactiveProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(inactiveProduct[0].is_active).toBe(false);
    expect(inactiveProduct[0].updated_at).toBeInstanceOf(Date);
  });
});
