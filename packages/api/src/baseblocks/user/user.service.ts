import { User } from '@baseline/types/user';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

export const userService = new ServiceObject<User>({
  dynamoDb: dynamoDb,
  objectName: 'User',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-user`,
  primaryKey: 'userId',
});
