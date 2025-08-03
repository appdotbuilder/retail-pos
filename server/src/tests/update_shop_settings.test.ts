
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { shopSettingsTable } from '../db/schema';
import { type UpdateShopSettingsInput } from '../schema';
import { updateShopSettings } from '../handlers/update_shop_settings';

// Test input for creating new settings
const testCreateInput: UpdateShopSettingsInput = {
  shop_name: 'Test Shop',
  shop_address: '123 Test Street',
  shop_phone: '+1234567890',
  shop_email: 'test@shop.com',
  tax_rate: 0.08,
  printer_type: 'thermal_80mm',
  receipt_header: 'Welcome to Test Shop',
  receipt_footer: 'Thank you!'
};

// Test input for updating existing settings
const testUpdateInput: UpdateShopSettingsInput = {
  shop_name: 'Updated Shop Name',
  tax_rate: 0.10,
  printer_type: 'thermal_58mm'
};

describe('updateShopSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new shop settings when none exist', async () => {
    const result = await updateShopSettings(testCreateInput);

    // Basic field validation
    expect(result.shop_name).toEqual('Test Shop');
    expect(result.shop_address).toEqual('123 Test Street');
    expect(result.shop_phone).toEqual('+1234567890');
    expect(result.shop_email).toEqual('test@shop.com');
    expect(result.tax_rate).toEqual(0.08);
    expect(typeof result.tax_rate).toEqual('number');
    expect(result.printer_type).toEqual('thermal_80mm');
    expect(result.receipt_header).toEqual('Welcome to Test Shop');
    expect(result.receipt_footer).toEqual('Thank you!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create settings with defaults when minimal input provided', async () => {
    const minimalInput: UpdateShopSettingsInput = {
      shop_name: 'Minimal Shop'
    };

    const result = await updateShopSettings(minimalInput);

    expect(result.shop_name).toEqual('Minimal Shop');
    expect(result.shop_address).toBeNull();
    expect(result.shop_phone).toBeNull();
    expect(result.shop_email).toBeNull();
    expect(result.tax_rate).toEqual(0);
    expect(result.printer_type).toEqual('thermal_58mm');
    expect(result.receipt_header).toBeNull();
    expect(result.receipt_footer).toBeNull();
  });

  it('should create settings with complete defaults when no input provided', async () => {
    const emptyInput: UpdateShopSettingsInput = {};

    const result = await updateShopSettings(emptyInput);

    expect(result.shop_name).toEqual('Default Shop');
    expect(result.shop_address).toBeNull();
    expect(result.shop_phone).toBeNull();
    expect(result.shop_email).toBeNull();
    expect(result.tax_rate).toEqual(0);
    expect(result.printer_type).toEqual('thermal_58mm');
    expect(result.receipt_header).toBeNull();
    expect(result.receipt_footer).toBeNull();
  });

  it('should save new settings to database', async () => {
    const result = await updateShopSettings(testCreateInput);

    const settings = await db.select()
      .from(shopSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].shop_name).toEqual('Test Shop');
    expect(settings[0].shop_address).toEqual('123 Test Street');
    expect(parseFloat(settings[0].tax_rate)).toEqual(0.08);
    expect(settings[0].printer_type).toEqual('thermal_80mm');
  });

  it('should update existing shop settings', async () => {
    // First create settings
    await updateShopSettings(testCreateInput);

    // Then update them
    const result = await updateShopSettings(testUpdateInput);

    expect(result.shop_name).toEqual('Updated Shop Name');
    expect(result.tax_rate).toEqual(0.10);
    expect(typeof result.tax_rate).toEqual('number');
    expect(result.printer_type).toEqual('thermal_58mm');
    // Should keep existing values for fields not updated
    expect(result.shop_address).toEqual('123 Test Street');
    expect(result.shop_phone).toEqual('+1234567890');
    expect(result.shop_email).toEqual('test@shop.com');
  });

  it('should update only specified fields', async () => {
    // Create initial settings
    await updateShopSettings(testCreateInput);

    // Update only tax rate
    const partialUpdate: UpdateShopSettingsInput = {
      tax_rate: 0.15
    };

    const result = await updateShopSettings(partialUpdate);

    // Tax rate should be updated
    expect(result.tax_rate).toEqual(0.15);
    // Other fields should remain unchanged
    expect(result.shop_name).toEqual('Test Shop');
    expect(result.shop_address).toEqual('123 Test Street');
    expect(result.printer_type).toEqual('thermal_80mm');
  });

  it('should maintain single settings record', async () => {
    // Create settings
    await updateShopSettings(testCreateInput);
    
    // Update settings
    await updateShopSettings(testUpdateInput);
    
    // Update again
    await updateShopSettings({ shop_name: 'Final Shop Name' });

    const allSettings = await db.select()
      .from(shopSettingsTable)
      .execute();

    // Should only have one record
    expect(allSettings).toHaveLength(1);
    expect(allSettings[0].shop_name).toEqual('Final Shop Name');
  });

  it('should handle null values correctly', async () => {
    const inputWithNulls: UpdateShopSettingsInput = {
      shop_name: 'Shop with Nulls',
      shop_address: null,
      shop_phone: null,
      shop_email: null,
      receipt_header: null,
      receipt_footer: null
    };

    const result = await updateShopSettings(inputWithNulls);

    expect(result.shop_name).toEqual('Shop with Nulls');
    expect(result.shop_address).toBeNull();
    expect(result.shop_phone).toBeNull();
    expect(result.shop_email).toBeNull();
    expect(result.receipt_header).toBeNull();
    expect(result.receipt_footer).toBeNull();
  });
});
