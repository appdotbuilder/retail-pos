
import { db } from '../db';
import { transactionsTable, transactionItemsTable, productsTable } from '../db/schema';
import { type DateRangeInput, type SalesReport } from '../schema';
import { gte, lte, and, eq, sql } from 'drizzle-orm';

export const getSalesReport = async (input: DateRangeInput): Promise<SalesReport[]> => {
  try {
    // Parse date strings to Date objects for comparison
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);
    
    // Set end date to end of day to include full day
    endDate.setHours(23, 59, 59, 999);

    // First get basic transaction data grouped by date
    const transactionResults = await db
      .select({
        date: sql<string>`DATE(${transactionsTable.created_at})`,
        total_sales: sql<string>`COALESCE(SUM(${transactionsTable.total_amount}), 0)`,
        total_transactions: sql<string>`COUNT(*)`,
        total_discount: sql<string>`COALESCE(SUM(${transactionsTable.discount_amount}), 0)`
      })
      .from(transactionsTable)
      .where(
        and(
          gte(transactionsTable.created_at, startDate),
          lte(transactionsTable.created_at, endDate),
          eq(transactionsTable.status, 'completed')
        )
      )
      .groupBy(sql`DATE(${transactionsTable.created_at})`)
      .orderBy(sql`DATE(${transactionsTable.created_at})`)
      .execute();

    // For each date, calculate the total cost separately
    const reportData: SalesReport[] = [];
    
    for (const txnData of transactionResults) {
      // Get total cost for this specific date
      const costResult = await db
        .select({
          total_cost: sql<string>`COALESCE(SUM(${transactionItemsTable.quantity} * ${productsTable.cost}), 0)`
        })
        .from(transactionsTable)
        .innerJoin(transactionItemsTable, eq(transactionItemsTable.transaction_id, transactionsTable.id))
        .innerJoin(productsTable, eq(transactionItemsTable.product_id, productsTable.id))
        .where(
          and(
            sql`DATE(${transactionsTable.created_at}) = ${txnData.date}`,
            gte(transactionsTable.created_at, startDate),
            lte(transactionsTable.created_at, endDate),
            eq(transactionsTable.status, 'completed')
          )
        )
        .execute();

      const totalCost = costResult.length > 0 ? parseFloat(costResult[0].total_cost) : 0;
      const totalSales = parseFloat(txnData.total_sales);

      reportData.push({
        date: txnData.date,
        total_sales: totalSales,
        total_transactions: parseInt(txnData.total_transactions),
        total_discount: parseFloat(txnData.total_discount),
        total_profit: totalSales - totalCost
      });
    }

    return reportData;
  } catch (error) {
    console.error('Sales report generation failed:', error);
    throw error;
  }
};
