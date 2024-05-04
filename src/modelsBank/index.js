const mongoose = require('mongoose');
const config = require('../core/config');
const logger = require('../core/logger')('app');

const bankSchema = require('./bank-schema');

mongoose.connect(`${config.database.connection}/${config.database.name}`, {
  useNewUrlParser: true,
});

const db = mongoose.connection;
db.once('open', () => {
  logger.info('Successfully connected to MongoDB');
});

const User = mongoose.model('bank', mongoose.Schema(bankSchema));

module.exports = {
  mongoose,
  User,
};
