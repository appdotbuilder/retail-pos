
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { shopSettingsTable } from '../db/schema';
import { getShopSettings } from '../handlers/get_shop_settings';

describe('getShopSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return default settings when none exist', async () => {
    const result = await getShopSettings();

    // Verify basic field structure
    expect(result.id).toBeDefined();
    expect(result.shop_name).toEqual('Default Shop');
    expect(result.shop_address).toBeNull();
    expect(result.shop_phone).toBeNull();
    expect(result.shop_email).toBeNull();
    expect(result.tax_rate).toEqual(0);
    expect(typeof result.tax_rate).toBe('number');
    expect(result.printer_type).toEqual('thermal_58mm');
    expect(result.receipt_header).toBeNull();
    expect(result.receipt_footer).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save default settings to database when none exist', async () => {
    await getShopSettings();

    // Verify settings were created in database
    const settings = await db.select()
      .from(shopSettingsTable)
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].shop_name).toEqual('Default Shop');
    expect(parseFloat(settings[0].tax_rate)).toEqual(0);
    expect(settings[0].printer_type).toEqual('thermal_58mm');
  });

  it('should return existing settings when they exist', async () => {
    // Create existing settings
    await db.insert(shopSettingsTable)
      .values({
        shop_name: 'My Test Shop',
        shop_address: '123 Test Street',
        shop_phone: '555-0123',
        shop_email: 'test@shop.com',
        tax_rate: '0.0825',
        printer_type: 'thermal_80mm',
        receipt_header: 'Welcome!',
        receipt_footer: 'Thank you!'
      })
      .execute();

    const result = await getShopSettings();

    expect(result.shop_name).toEqual('My Test Shop');
    expect(result.shop_address).toEqual('123 Test Street');
    expect(result.shop_phone).toEqual('555-0123');
    expect(result.shop_email).toEqual('test@shop.com');
    expect(result.tax_rate).toEqual(0.0825);
    expect(typeof result.tax_rate).toBe('number');
    expect(result.printer_type).toEqual('thermal_80mm');
    expect(result.receipt_header).toEqual('Welcome!');
    expect(result.receipt_footer).toEqual('Thank you!');
  });

  it('should only return the first settings record when multiple exist', async () => {
    // Create multiple settings records
    await db.insert(shopSettingsTable)
      .values([
        {
          shop_name: 'First Shop',
          tax_rate: '0.05',
          printer_type: 'thermal_58mm'
        },
        {
          shop_name: 'Second Shop',
          tax_rate: '0.10',
          printer_type: 'thermal_80mm'
        }
      ])
      .execute();

    const result = await getShopSettings();

    expect(result.shop_name).toEqual('First Shop');
    expect(result.tax_rate).toEqual(0.05);
    expect(result.printer_type).toEqual('thermal_58mm');
  });
});
