import Router from 'koa-router';
import validate from 'koa2-validation';
import middleware from './middleware/middleware';
import userController from './controllers/users';
import candidateController from './controllers/candidates';
import themeController from './controllers/theme';
import pollController from './controllers/poll';

const router = new Router();

router.post('/api/:version/poll/users', middleware.getBody, validate(userController.v.createUser), userController.createUser);
router.get('/api/:version/poll/users/email', validate(userController.v.verifyEmail), userController.verifyEmail);
router.post('/api/:version/poll/users/email', validate(userController.v.sendEmail), userController.sendEmail);
router.post('/api/:version/poll/candidates', middleware.adminAuth, middleware.getBody, validate(candidateController.v.createCandidate), candidateController.createCandidate);
router.put('/api/:version/poll/candidates/:candidateId', middleware.adminAuth, middleware.getBody, validate(candidateController.v.updateCandidate), candidateController.updateCandidate);
router.get('/api/:version/poll/candidates', validate(candidateController.v.getCandidate), candidateController.getCandidate);
router.delete('/api/:version/poll/candidates', middleware.getBody, validate(candidateController.v.deleteCandidate), candidateController.deleteCandidate);
router.post('/api/:version/poll/themes', middleware.adminAuth, middleware.getBody, validate(themeController.v.createTheme), themeController.createTheme);
router.put('/api/:version/poll/themes/:themeId', middleware.adminAuth, middleware.getBody, validate(themeController.v.updateTheme), themeController.updateTheme);
router.get('/api/:version/poll/themes', validate(themeController.v.getTheme), themeController.getTheme);
router.put('/api/:version/poll/results', middleware.userAuth, middleware.getBody, validate(pollController.v.submitPoll), pollController.submitPoll);
router.post('/api/:version/poll/results', middleware.getBody, validate(pollController.v.persistence), pollController.persistence);

export default (app) => {
  app
    .use(router.routes())
    .use(router.allowedMethods());
};
