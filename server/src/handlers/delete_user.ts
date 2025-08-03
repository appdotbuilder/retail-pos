
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';

export const deleteUser = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First check if user exists and is active
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    if (!user[0].is_active) {
      throw new Error('User is already inactive');
    }

    // Check if this is an admin user
    if (user[0].role === 'admin') {
      // Count remaining active admin users
      const activeAdmins = await db.select()
        .from(usersTable)
        .where(and(
          eq(usersTable.role, 'admin'),
          eq(usersTable.is_active, true),
          ne(usersTable.id, id)
        ))
        .execute();

      if (activeAdmins.length === 0) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Soft delete by setting is_active to false
    await db.update(usersTable)
      .set({ 
        is_active: false,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};
