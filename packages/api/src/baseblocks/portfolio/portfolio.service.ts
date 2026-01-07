import { Portfolio } from '@baseline/types/portfolio';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

export const portfolioService = new ServiceObject<Portfolio>({
  dynamoDb: dynamoDb,
  objectName: 'Portfolio',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-portfolio`,
  primaryKey: 'portfolioId',
});
