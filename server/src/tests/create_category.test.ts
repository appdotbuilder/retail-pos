
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Electronics',
  description: 'Electronic devices and accessories'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with description', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Electronics');
    expect(result.description).toEqual('Electronic devices and accessories');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category without description', async () => {
    const inputWithoutDescription: CreateCategoryInput = {
      name: 'Clothing'
    };

    const result = await createCategory(inputWithoutDescription);

    expect(result.name).toEqual('Clothing');
    expect(result.description).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Electronics');
    expect(categories[0].description).toEqual('Electronic devices and accessories');
    expect(categories[0].is_active).toEqual(true);
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple categories with unique names', async () => {
    const category1Input: CreateCategoryInput = {
      name: 'Books',
      description: 'Books and literature'
    };

    const category2Input: CreateCategoryInput = {
      name: 'Sports',
      description: 'Sports equipment and gear'
    };

    const result1 = await createCategory(category1Input);
    const result2 = await createCategory(category2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Books');
    expect(result2.name).toEqual('Sports');

    // Verify both categories exist in database
    const allCategories = await db.select().from(categoriesTable).execute();
    expect(allCategories).toHaveLength(2);
  });
});
