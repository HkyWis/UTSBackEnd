const express = require('express');

const authenticationControllers = require('./authentication-controller');
const authenticationValidators = require('./authentication-validator');
const celebrate = require('../../../core/celebrate-wrappers');
const rateLimiterMiddleware = require('../../middlewares/rateLimiterMiddleware');


const route = express.Router();

module.exports = (app) => {
  app.use('/authentication', route);

  route.post(
    '/login',
    rateLimiterMiddleware, // batas login
    celebrate(authenticationValidators.login),
    authenticationControllers.login
  );
};
