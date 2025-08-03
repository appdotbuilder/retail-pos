
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Simple test input
const testCategoryInput: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing'
};

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return active categories', async () => {
    // Create test category
    await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        description: testCategoryInput.description
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Category');
    expect(result[0].description).toEqual('A category for testing');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should not return inactive categories', async () => {
    // Create inactive category
    await db.insert(categoriesTable)
      .values({
        name: 'Inactive Category',
        description: 'This category is inactive',
        is_active: false
      })
      .execute();

    const result = await getCategories();
    expect(result).toHaveLength(0);
  });

  it('should return multiple active categories', async () => {
    // Create multiple categories
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Category 1',
          description: 'First category'
        },
        {
          name: 'Category 2',
          description: 'Second category'
        },
        {
          name: 'Inactive Category',
          description: 'This should not appear',
          is_active: false
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result.map(cat => cat.name)).toEqual(['Category 1', 'Category 2']);
    expect(result.every(cat => cat.is_active)).toBe(true);
  });
});
