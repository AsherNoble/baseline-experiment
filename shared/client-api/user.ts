import { User } from '@baseline/types/user';
import { RequestHandler } from './request-handler';

export const getUser = async (requestHandler: RequestHandler, userSub: string): Promise<User> => {
  const response = await requestHandler.request<User>({
    method: 'GET',
    url: `user/${userSub}`,
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const getAllUsers = async (requestHandler: RequestHandler): Promise<User[]> => {
  const response = await requestHandler.request<User[]>({
    method: 'GET',
    url: `user/list`,
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const deleteUser = async (requestHandler: RequestHandler, userSub: string): Promise<boolean> => {
  const response = await requestHandler.request<boolean>({
    method: 'DELETE',
    url: `user/${userSub}`,
    hasAuthentication: true,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const createUser = async (
  requestHandler: RequestHandler,
  user: Partial<User>,
): Promise<User> => {
  const response = await requestHandler.request<User>({
    method: 'POST',
    url: `user`,
    hasAuthentication: true,
    data: user,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};

export const updateUser = async (
  requestHandler: RequestHandler,
  user: Partial<User>,
): Promise<User> => {
  const response = await requestHandler.request<User>({
    method: 'PATCH',
    url: `user`,
    hasAuthentication: true,
    data: user,
  });
  if ('data' in response) {
    return response.data;
  }
  throw response;
};
