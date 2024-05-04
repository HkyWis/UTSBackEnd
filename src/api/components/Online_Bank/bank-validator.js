const joi = require('joi');
const { joiPasswordExtendCore } = require('joi-password');
const joiPassword = joi.extend(joiPasswordExtendCore);

module.exports = {
  createUser: {
    body: {
      name: joi.string().min(1).max(100).required().label('Name'),
      email: joi.string().email().required().label('Email'),
      kartu: joi.string().required().label('Card Number'),
      nominal: joi.number().min(10000).required().label('Nominal'), 
      password: joiPassword
        .string()
        .minOfSpecialCharacters(1)
        .minOfLowercase(1)
        .minOfUppercase(1)
        .minOfNumeric(1)
        .noWhiteSpaces()
        .onlyLatinCharacters()
        .min(6)
        .max(32)
        .required()
        .label('Password'),
      password_confirm: joi.string().required().label('Password confirmation'),
    },
  },
  login: {
    body: {
      email: joi.string().email().required().label('Email'),
      password: joi.string().required().label('Password'),
      password_confirm: joi.string().required().label('Password confirmation'),
    },
  },
  transfer: {
    body: {
      pengirimId: joi.string().required().label('Sender ID'),
      penerimaEmail: joi.string().email().required().label('Recipient Email'),
      nominal: joi.number().positive().required().label('Amount'),
    },
  },
  addBalance: {
    body: {
      userId: joi.string().required().label('User ID'),
      email: joi.string().email().required().label('Email'),
      nominal: joi.number().min(10000).positive().required().label('Amount'),
    },
  },
  tarikTunai: {
    body: {
      userId: joi.string().required().label('User ID'),
      email: joi.string().email().required().label('Email'),
      kartu: joi.string().required().label('Card Number'),
      nominal: joi.number().positive().required().label('Amount'),
    },
  },
}