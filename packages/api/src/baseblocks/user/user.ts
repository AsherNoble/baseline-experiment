import { User } from '@baseline/types/user';

export const userMapper = (data: User): User => {
  const user: User = {
    userSub: data?.userSub,
    email: data?.email,
    createdAt: data?.createdAt,
  };
  return user;
};
