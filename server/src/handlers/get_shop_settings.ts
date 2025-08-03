
import { db } from '../db';
import { shopSettingsTable } from '../db/schema';
import { type ShopSettings } from '../schema';

export const getShopSettings = async (): Promise<ShopSettings> => {
  try {
    // Try to get existing shop settings
    const results = await db.select()
      .from(shopSettingsTable)
      .limit(1)
      .execute();

    if (results.length > 0) {
      // Convert numeric fields back to numbers
      const settings = results[0];
      return {
        ...settings,
        tax_rate: parseFloat(settings.tax_rate)
      };
    }

    // If no settings exist, create default settings
    const defaultSettings = await db.insert(shopSettingsTable)
      .values({
        shop_name: 'Default Shop',
        shop_address: null,
        shop_phone: null,
        shop_email: null,
        tax_rate: '0',
        printer_type: 'thermal_58mm',
        receipt_header: null,
        receipt_footer: null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers
    const settings = defaultSettings[0];
    return {
      ...settings,
      tax_rate: parseFloat(settings.tax_rate)
    };
  } catch (error) {
    console.error('Get shop settings failed:', error);
    throw error;
  }
};
