
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq, sql, gte, lt, and } from 'drizzle-orm';

export const getDailyRevenue = async (date?: string): Promise<{ revenue: number; date: string }> => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Create date boundaries for the target date
    const startDate = new Date(`${targetDate}T00:00:00.000Z`);
    const endDate = new Date(`${targetDate}T23:59:59.999Z`);

    // Query for total revenue of completed transactions on the target date
    const result = await db.select({
      total: sql<string>`COALESCE(SUM(${transactionsTable.total_amount}), 0)`
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.status, 'completed'),
        gte(transactionsTable.created_at, startDate),
        lt(transactionsTable.created_at, endDate)
      )
    )
    .execute();

    // Convert the sum result to number (it's returned as string from numeric column)
    const revenue = parseFloat(result[0]?.total || '0');

    return {
      revenue,
      date: targetDate
    };
  } catch (error) {
    console.error('Failed to get daily revenue:', error);
    throw error;
  }
};
