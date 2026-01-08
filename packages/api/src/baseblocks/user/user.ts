import { User } from '@baseline/types/user';

export const userMapper = (data: User): User => {
  const user: User = {
    userId: data?.userId,
    username: data?.username,
    email: data?.email,
    password: data?.password,
  };
  return user;
};
