
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for admin user
const testAdminInput: CreateUserInput = {
  username: 'testadmin',
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin'
};

// Test input for cashier user
const testCashierInput: CreateUserInput = {
  username: 'testcashier',
  email: 'cashier@test.com',
  password: 'password456',
  role: 'cashier'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an admin user', async () => {
    const result = await createUser(testAdminInput);

    // Basic field validation
    expect(result.username).toEqual('testadmin');
    expect(result.email).toEqual('admin@test.com');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should create a cashier user', async () => {
    const result = await createUser(testCashierInput);

    expect(result.username).toEqual('testcashier');
    expect(result.email).toEqual('cashier@test.com');
    expect(result.role).toEqual('cashier');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(testAdminInput);

    // Verify password is hashed and can be compared
    const isValidPassword = await Bun.password.verify('password123', result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify wrong password doesn't match
    const isWrongPassword = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isWrongPassword).toBe(false);
  });

  it('should save user to database', async () => {
    const result = await createUser(testAdminInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testadmin');
    expect(users[0].email).toEqual('admin@test.com');
    expect(users[0].role).toEqual('admin');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique username constraint', async () => {
    // Create first user
    await createUser(testAdminInput);

    // Try to create another user with same username but different email
    const duplicateUsernameInput: CreateUserInput = {
      username: 'testadmin', // Same username
      email: 'different@test.com', // Different email
      password: 'password789',
      role: 'cashier'
    };

    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testAdminInput);

    // Try to create another user with same email but different username
    const duplicateEmailInput: CreateUserInput = {
      username: 'differentuser', // Different username
      email: 'admin@test.com', // Same email
      password: 'password789',
      role: 'cashier'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate key value/i);
  });
});
