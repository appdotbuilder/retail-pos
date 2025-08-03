
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete a cashier user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'admin1',
          email: 'admin1@test.com',
          password_hash: 'hashed_password_123',
          role: 'admin'
        },
        {
          username: 'cashier1',
          email: 'cashier1@test.com',
          password_hash: 'hashed_password_456',
          role: 'cashier'
        }
      ])
      .returning()
      .execute();

    const cashierUser = users.find(u => u.role === 'cashier')!;

    // Delete the cashier user
    const result = await deleteUser(cashierUser.id);

    expect(result.success).toBe(true);

    // Verify user is soft deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, cashierUser.id))
      .execute();

    expect(deletedUser).toHaveLength(1);
    expect(deletedUser[0].is_active).toBe(false);
    expect(deletedUser[0].updated_at).toBeInstanceOf(Date);
  });

  it('should delete an admin user when other admins exist', async () => {
    // Create multiple admin users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'admin1',
          email: 'admin1@test.com',
          password_hash: 'hashed_password_123',
          role: 'admin'
        },
        {
          username: 'admin2',
          email: 'admin2@test.com',
          password_hash: 'hashed_password_456',
          role: 'admin'
        }
      ])
      .returning()
      .execute();

    const firstAdmin = users[0];

    // Delete one admin user
    const result = await deleteUser(firstAdmin.id);

    expect(result.success).toBe(true);

    // Verify user is soft deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, firstAdmin.id))
      .execute();

    expect(deletedUser[0].is_active).toBe(false);
  });

  it('should prevent deletion of the last admin user', async () => {
    // Create only one admin user
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'admin1',
          email: 'admin1@test.com',
          password_hash: 'hashed_password_123',
          role: 'admin'
        }
      ])
      .returning()
      .execute();

    const adminUser = users[0];

    // Attempt to delete the last admin user
    await expect(deleteUser(adminUser.id)).rejects.toThrow(/cannot delete the last admin user/i);

    // Verify user is still active
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, adminUser.id))
      .execute();

    expect(user[0].is_active).toBe(true);
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteUser(nonExistentId)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when trying to delete already inactive user', async () => {
    // Create an inactive user
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'admin1',
          email: 'admin1@test.com',
          password_hash: 'hashed_password_123',
          role: 'admin'
        },
        {
          username: 'inactive_user',
          email: 'inactive@test.com',
          password_hash: 'hashed_password_456',
          role: 'cashier',
          is_active: false
        }
      ])
      .returning()
      .execute();

    const inactiveUser = users.find(u => !u.is_active)!;

    await expect(deleteUser(inactiveUser.id)).rejects.toThrow(/user is already inactive/i);
  });

  it('should prevent deletion when last admin with other inactive admins exist', async () => {
    // Create admin users where one is already inactive
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'admin1',
          email: 'admin1@test.com',
          password_hash: 'hashed_password_123',
          role: 'admin',
          is_active: true
        },
        {
          username: 'admin2',
          email: 'admin2@test.com',
          password_hash: 'hashed_password_456',
          role: 'admin',
          is_active: false // Already inactive
        }
      ])
      .returning()
      .execute();

    const activeAdmin = users.find(u => u.is_active)!;

    // Should prevent deletion as this is the last ACTIVE admin
    await expect(deleteUser(activeAdmin.id)).rejects.toThrow(/cannot delete the last admin user/i);
  });
});
