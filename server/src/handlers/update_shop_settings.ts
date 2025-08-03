
import { db } from '../db';
import { shopSettingsTable } from '../db/schema';
import { type UpdateShopSettingsInput, type ShopSettings } from '../schema';

export const updateShopSettings = async (input: UpdateShopSettingsInput): Promise<ShopSettings> => {
  try {
    // Check if settings exist
    const existingSettings = await db.select()
      .from(shopSettingsTable)
      .limit(1)
      .execute();

    let result;

    if (existingSettings.length === 0) {
      // Create new settings record with input values and defaults for missing fields
      result = await db.insert(shopSettingsTable)
        .values({
          shop_name: input.shop_name || 'Default Shop',
          shop_address: input.shop_address || null,
          shop_phone: input.shop_phone || null,
          shop_email: input.shop_email || null,
          tax_rate: input.tax_rate?.toString() || '0',
          printer_type: input.printer_type || 'thermal_58mm',
          receipt_header: input.receipt_header || null,
          receipt_footer: input.receipt_footer || null
        })
        .returning()
        .execute();
    } else {
      // Update existing settings record
      const updateData: any = {};
      
      if (input.shop_name !== undefined) updateData.shop_name = input.shop_name;
      if (input.shop_address !== undefined) updateData.shop_address = input.shop_address;
      if (input.shop_phone !== undefined) updateData.shop_phone = input.shop_phone;
      if (input.shop_email !== undefined) updateData.shop_email = input.shop_email;
      if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate.toString();
      if (input.printer_type !== undefined) updateData.printer_type = input.printer_type;
      if (input.receipt_header !== undefined) updateData.receipt_header = input.receipt_header;
      if (input.receipt_footer !== undefined) updateData.receipt_footer = input.receipt_footer;

      // Add updated_at timestamp
      updateData.updated_at = new Date();

      result = await db.update(shopSettingsTable)
        .set(updateData)
        .returning()
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    const settings = result[0];
    return {
      ...settings,
      tax_rate: parseFloat(settings.tax_rate)
    };
  } catch (error) {
    console.error('Shop settings update failed:', error);
    throw error;
  }
};
