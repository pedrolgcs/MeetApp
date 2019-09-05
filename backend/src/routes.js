import { Router } from 'express';
import multer from 'multer';
/* Middlewares */
import authMiddleware from './app/middlewares/auth';
/* Controllers */
import UserController from './app/controllers/UserController';
import FileController from './app/controllers/FileController';
import SessionController from './app/controllers/SessionController';
import MeetupController from './app/controllers/MeetupController';
import SubscriptionController from './app/controllers/SubscriptionController';
import OrganizingController from './app/controllers/OrganizingController';
/* Configs */
import multerConfig from './config/multer';

const upload = multer(multerConfig);
const routes = new Router();

/* index api */
routes.get('/', (req, res) => res.json({ message: 'Enjoy the silence ' }));

/* Auth */
routes.post('/sessions', SessionController.store);

/* Users */
routes.post('/users', UserController.store);
routes.put('/users', [authMiddleware], UserController.update);

routes.use(authMiddleware);

/* Files */
routes.post('/files', upload.single('file'), FileController.store);

/* Meetups */
routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:id', MeetupController.update);
routes.delete('/meetups/:id', MeetupController.delete);

/* Organizing */
routes.get('/organizations', OrganizingController.index);

/* Subscription */
routes.get('/subscriptions', SubscriptionController.index);
routes.post('/subscriptions/:meetupId', SubscriptionController.store);

export default routes;
