import { User } from '@baseline/types/user';
import { getErrorMessage } from '../../util/error-message';
import { getDynamodbConnection } from '@baselinejs/dynamodb';
import { ServiceObject } from '../../util/service-object';

const dynamoDb = getDynamodbConnection({
  region: `${process.env.API_REGION}`,
});

export const userService = new ServiceObject<User>({
  dynamoDb: dynamoDb,
  objectName: 'User',
  table: `${process.env.APP_NAME}-${process.env.NODE_ENV}-user`,
  primaryKey: 'userSub',
});

export const getOrCreateUser = async (
  userSub: string,
  email: string,
): Promise<User> => {
  try {
    const existingUser = await userService.get(userSub);
    if (existingUser?.userSub) {
      return existingUser;
    }
  } catch (error) {
    // User doesn't exist, will create below
  }

  // Create new user
  const newUser: Partial<User> = {
    userSub,
    email,
    createdAt: new Date().toISOString(),
  };
  return userService.create(newUser);
};

export const isUserSub = async (userSub: string): Promise<boolean> => {
  try {
    const user = await userService.get(userSub);
    return !!user?.userSub;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error(`Failed to check if user: ${message}`);
    return false;
  }
};
