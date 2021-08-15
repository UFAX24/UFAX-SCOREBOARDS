'use strict';

require('dotenv').config();

const ENV = process.env;

module.exports = {
  name: ENV.APP_NAME,
  port: ENV.APP_PORT,
  env: ENV.APP_ENV,
};
