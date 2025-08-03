
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (): Promise<number> => {
  const passwordHash = await Bun.password.hash('password123');
  
  const result = await db.insert(usersTable)
    .values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: passwordHash,
      role: 'cashier',
      is_active: true
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic user fields', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'updateduser',
      email: 'updated@example.com',
      role: 'admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('updateduser');
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update password and hash it correctly', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      password: 'newpassword456'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('newpassword456'); // Should be hashed

    // Verify password was hashed correctly
    const isValidPassword = await Bun.password.verify('newpassword456', result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify old password no longer works
    const isOldPasswordValid = await Bun.password.verify('password123', result.password_hash);
    expect(isOldPasswordValid).toBe(false);
  });

  it('should update is_active status', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.is_active).toEqual(false);
    expect(result.username).toEqual('testuser'); // Should remain unchanged
  });

  it('should update only specified fields', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'partialupdate'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('partialupdate');
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('cashier'); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'persisteduser',
      email: 'persisted@example.com'
    };

    await updateUser(updateInput);

    // Query database directly to verify changes
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('persisteduser');
    expect(users[0].email).toEqual('persisted@example.com');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserInput = {
      id: 999999, // Non-existent ID
      username: 'nonexistent'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
  });

  it('should update multiple fields at once', async () => {
    const userId = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: userId,
      username: 'multiupdate',
      email: 'multi@example.com',
      role: 'admin',
      is_active: false,
      password: 'newmultipass'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(userId);
    expect(result.username).toEqual('multiupdate');
    expect(result.email).toEqual('multi@example.com');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(false);
    expect(result.password_hash).toBeDefined();

    // Verify new password works
    const isValidPassword = await Bun.password.verify('newmultipass', result.password_hash);
    expect(isValidPassword).toBe(true);
  });
});
