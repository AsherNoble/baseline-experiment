import { Response } from 'express';
import { userMapper } from './user';
import { isAdmin } from '../../middleware/is-admin';
import { RequestContext } from '../../util/request-context.type';
import { User } from '@baseline/types/user';
import { getErrorMessage } from '../../util/error-message';
import createApp from '../../util/express-app';
import createAuthenticatedHandler from '../../util/create-authenticated-handler';
import { userService } from './user.service';

const app = createApp();
// app.use(isAdmin); // All private endpoints require the user to be an admin
export const handler = createAuthenticatedHandler(app);

app.post('/user', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const { username, email, password } = req.body as User;
      const userData: Partial<User> = {
        username, email, password,
      };
      const user = await userService.create(userData);
      res.json(userMapper(user));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to create user ${message}`);
      res.status(400).json({ error: 'Failed to create user' });
    }
  },
]);

app.patch('/user', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const { userId, username, email, password } = req.body as User;
      const userData: Partial<User> = {
        userId, username, email, password
      };
      const user = await userService.update(userData);
      res.json(userMapper(user));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to update user: ${message}`);
      res.status(400).json({
        error: 'Failed to update user',
      });
    }
  },
]);

app.delete('/user/:userId', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const userId = req.params.userId;
      await userService.delete(userId);
      res.status(200);
      res.send();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to delete user: ${message}`);
      res.status(400).json({
        error: 'Failed to delete user',
      });
    }
  },
]);

app.get('/user/list', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const users = await userService.getAll();
      const formattedUsers = users.map(userMapper);
      res.json(formattedUsers);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get users: ${message}`);
      res.status(400).json({
        error: 'Failed to get users',
      });
    }
  },
]);

app.get('/user/:userId', [
  isAdmin,
  async (req: RequestContext, res: Response) => {
    try {
      const user = await userService.get(req.params.userId);
      res.json(userMapper(user));
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(`Failed to get user: ${message}`);
      res.status(400).json({
        error: 'Failed to get user',
      });
    }
  },
]);
