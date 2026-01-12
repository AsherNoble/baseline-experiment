import { Holding } from '@baseline/types/holding';
import { getDynamodbConnection, queryItems, queryItemsRange } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

export const holdingService = new ServiceObject<Holding>({
  dynamoDb: dynamoDb,
  objectName: 'Holding',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-holding`,
  primaryKey: 'holdingId',
});

/**
 * Get all holdings for a specific portfolio using the GSI
 */
export const getHoldingsByPortfolioId = async (portfolioId: string): Promise<Holding[]> => {
  console.log(`Get holdings by portfolioId [${portfolioId}]`);
  try {
    return await queryItems<Holding>({
      dynamoDb: dynamoDb,
      table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-holding`,
      keyName: 'portfolioId',
      keyValue: portfolioId,
      indexName: 'portfolioId-index',
    });
  } catch (error) {
    console.error(`Failed to get holdings by portfolioId: ${error}`);
    throw error;
  }
};

/**
 * Get a specific holding by portfolioId and symbol using the GSI
 */
export const getHoldingByPortfolioAndSymbol = async (
  portfolioId: string,
  symbol: string,
): Promise<Holding | null> => {
  console.log(`Get holding by portfolioId [${portfolioId}] and symbol [${symbol}]`);
  try {
    const holdings = await queryItemsRange<Holding>({
      dynamoDb: dynamoDb,
      table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-holding`,
      keyName: 'portfolioId',
      keyValue: portfolioId,
      rangeKeyName: 'symbol',
      rangeKeyValue: symbol,
      indexName: 'portfolioId-index',
      fuzzy: false, // Exact match on symbol
    });

    return holdings.length > 0 ? holdings[0] : null;
  } catch (error) {
    console.error(`Failed to get holding by portfolioId and symbol: ${error}`);
    throw error;
  }
};
