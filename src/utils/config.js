const dotenv = require('dotenv');
dotenv.config({
  path: '../../.env',
});

module.exports = {
  DB_USER: process.env.DB_USER,
  DB_PWD: process.env.DB_PWD,
  DB_NAME: process.env.DB_NAME,
};
