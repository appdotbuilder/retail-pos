
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { getCustomers } from '../handlers/get_customers';

// Test customer data
const testCustomer1: CreateCustomerInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State'
};

const testCustomer2: CreateCustomerInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+0987654321',
  address: '456 Oak Ave, City, State'
};

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();

    expect(result).toEqual([]);
  });

  it('should return all customers', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values([testCustomer1, testCustomer2])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    
    // Check first customer
    const customer1 = result.find(c => c.name === 'John Doe');
    expect(customer1).toBeDefined();
    expect(customer1!.email).toEqual('john@example.com');
    expect(customer1!.phone).toEqual('+1234567890');
    expect(customer1!.address).toEqual('123 Main St, City, State');
    expect(customer1!.id).toBeDefined();
    expect(customer1!.created_at).toBeInstanceOf(Date);
    expect(customer1!.updated_at).toBeInstanceOf(Date);

    // Check second customer
    const customer2 = result.find(c => c.name === 'Jane Smith');
    expect(customer2).toBeDefined();
    expect(customer2!.email).toEqual('jane@example.com');
    expect(customer2!.phone).toEqual('+0987654321');
    expect(customer2!.address).toEqual('456 Oak Ave, City, State');
    expect(customer2!.id).toBeDefined();
    expect(customer2!.created_at).toBeInstanceOf(Date);
    expect(customer2!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle customers with nullable fields', async () => {
    // Create customer with minimal data
    const minimalCustomer: CreateCustomerInput = {
      name: 'Minimal Customer'
    };

    await db.insert(customersTable)
      .values(minimalCustomer)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Customer');
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return customers in database order', async () => {
    // Create customers in specific order
    await db.insert(customersTable)
      .values(testCustomer1)
      .execute();

    await db.insert(customersTable)
      .values(testCustomer2)
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    // First inserted customer should have lower ID
    expect(result[0].id).toBeLessThan(result[1].id);
  });
});
