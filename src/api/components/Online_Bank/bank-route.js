const express = require('express');

const authenticationMiddleware = require('../../middlewares/authentication-middleware');
const celebrate = require('../../../core/celebrate-wrappers');
const bankControllers = require('./bank-controller');
const bankValidator = require('./bank-validator');
const rateLimiterMiddleware = require('../../middlewares/rateLimiterMiddleware');
const route = express.Router();

module.exports = (app) => {
  app.use('/bank', route);
  // Create user
  route.post(
    '/',
    authenticationMiddleware,
    celebrate(bankValidator.createUser),
    bankControllers.createUser
  );
  //login
  route.post(
    '/login',
    rateLimiterMiddleware, // batas login
    celebrate(bankValidator.login),
    bankControllers.login
  );

  //cek acc
  route.get('/', authenticationMiddleware, bankControllers.getUsers);

  // Transfer
  route.put(
    '/transfer',
    authenticationMiddleware,
    celebrate(bankValidator.transfer),
    bankControllers.transfer
  );

  //add balance 
  route.put(
    '/add-balance',
    authenticationMiddleware,
    celebrate(bankValidator.addBalance),
    bankControllers.addBalance
  );

  //Tarik Tunai
  route.put(
    '/tarikTunai',
    authenticationMiddleware,
    celebrate(bankValidator.tarikTunai),
    bankControllers.tarikTunai
  );

  //delete acc
  route.delete('/:id', authenticationMiddleware, bankControllers.deleteUser);

};