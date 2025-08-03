
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUser1: CreateUserInput = {
  username: 'testuser1',
  email: 'test1@example.com',
  password: 'password123',
  role: 'cashier'
};

const testUser2: CreateUserInput = {
  username: 'testuser2',
  email: 'test2@example.com',
  password: 'password456',
  role: 'admin'
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users - using plain text password hashes for testing
    await db.insert(usersTable).values([
      {
        username: testUser1.username,
        email: testUser1.email,
        password_hash: 'hashed_password_123',
        role: testUser1.role
      },
      {
        username: testUser2.username,
        email: testUser2.email,
        password_hash: 'hashed_password_456',
        role: testUser2.role
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check user 1
    const user1 = result.find(u => u.username === 'testuser1');
    expect(user1).toBeDefined();
    expect(user1!.email).toEqual('test1@example.com');
    expect(user1!.role).toEqual('cashier');
    expect(user1!.is_active).toEqual(true);
    expect(user1!.password_hash).toEqual('hashed_password_123');
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);

    // Check user 2
    const user2 = result.find(u => u.username === 'testuser2');
    expect(user2).toBeDefined();
    expect(user2!.email).toEqual('test2@example.com');
    expect(user2!.role).toEqual('admin');
    expect(user2!.is_active).toEqual(true);
    expect(user2!.password_hash).toEqual('hashed_password_456');
    expect(user2!.created_at).toBeInstanceOf(Date);
    expect(user2!.updated_at).toBeInstanceOf(Date);
  });

  it('should include inactive users in results', async () => {
    // Create an inactive user
    await db.insert(usersTable).values({
      username: testUser1.username,
      email: testUser1.email,
      password_hash: 'hashed_password_123',
      role: testUser1.role,
      is_active: false
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0].is_active).toEqual(false);
    expect(result[0].username).toEqual('testuser1');
  });

  it('should return users with proper field types', async () => {
    await db.insert(usersTable).values({
      username: testUser1.username,
      email: testUser1.email,
      password_hash: 'hashed_password_123',
      role: testUser1.role
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    expect(typeof user.id).toBe('number');
    expect(typeof user.username).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(typeof user.password_hash).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(typeof user.is_active).toBe('boolean');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});
