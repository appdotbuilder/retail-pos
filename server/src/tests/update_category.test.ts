
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name', async () => {
    // Create test category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCategoryInput = {
      id: category[0].id,
      name: 'Updated Category'
    };

    const result = await updateCategory(testInput);

    expect(result.id).toEqual(category[0].id);
    expect(result.name).toEqual('Updated Category');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.is_active).toEqual(true); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > category[0].updated_at).toBe(true);
  });

  it('should update category description', async () => {
    // Create test category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCategoryInput = {
      id: category[0].id,
      description: 'Updated description'
    };

    const result = await updateCategory(testInput);

    expect(result.name).toEqual('Test Category'); // Unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at > category[0].updated_at).toBe(true);
  });

  it('should update category active status', async () => {
    // Create test category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        is_active: true
      })
      .returning()
      .execute();

    const testInput: UpdateCategoryInput = {
      id: category[0].id,
      is_active: false
    };

    const result = await updateCategory(testInput);

    expect(result.name).toEqual('Test Category'); // Unchanged
    expect(result.is_active).toEqual(false);
    expect(result.updated_at > category[0].updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    // Create test category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        description: 'Original description',
        is_active: true
      })
      .returning()
      .execute();

    const testInput: UpdateCategoryInput = {
      id: category[0].id,
      name: 'Updated Category',
      description: 'Updated description',
      is_active: false
    };

    const result = await updateCategory(testInput);

    expect(result.name).toEqual('Updated Category');
    expect(result.description).toEqual('Updated description');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at > category[0].updated_at).toBe(true);
  });

  it('should save updated category to database', async () => {
    // Create test category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCategoryInput = {
      id: category[0].id,
      name: 'Updated Category',
      description: 'Updated description'
    };

    await updateCategory(testInput);

    // Verify changes in database
    const updatedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category[0].id))
      .execute();

    expect(updatedCategory).toHaveLength(1);
    expect(updatedCategory[0].name).toEqual('Updated Category');
    expect(updatedCategory[0].description).toEqual('Updated description');
    expect(updatedCategory[0].updated_at > category[0].updated_at).toBe(true);
  });

  it('should handle null description update', async () => {
    // Create test category first
    const category = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Some description'
      })
      .returning()
      .execute();

    const testInput: UpdateCategoryInput = {
      id: category[0].id,
      description: null
    };

    const result = await updateCategory(testInput);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Category'); // Unchanged
  });

  it('should throw error when category does not exist', async () => {
    const testInput: UpdateCategoryInput = {
      id: 99999,
      name: 'Updated Category'
    };

    await expect(updateCategory(testInput)).rejects.toThrow(/not found/i);
  });
});
