import { Transaction } from '@baseline/types/transaction';
import { getDynamodbConnection, queryItems } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

export const transactionService = new ServiceObject<Transaction>({
  dynamoDb: dynamoDb,
  objectName: 'Transaction',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-transaction`,
  primaryKey: 'transactionId',
});

/**
 * Get all transactions for a specific portfolio using the GSI
 * Results are sorted by timestamp (most recent first)
 */
export const getTransactionsByPortfolioId = async (portfolioId: string): Promise<Transaction[]> => {
  console.log(`Get transactions by portfolioId [${portfolioId}]`);
  try {
    return await queryItems<Transaction>({
      dynamoDb: dynamoDb,
      table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-transaction`,
      keyName: 'portfolioId',
      keyValue: portfolioId,
      indexName: 'portfolioId-timestamp-index',
      scanIndexForward: false, // Most recent first
    });
  } catch (error) {
    console.error(`Failed to get transactions by portfolioId: ${error}`);
    throw error;
  }
};
