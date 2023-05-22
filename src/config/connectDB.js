const mongoose = require('mongoose');
const logger = require('../utils/winston');
require('dotenv').config();

const connectDB = async () => {
  
  mongoose.set('debug', true);
  const db = mongoose.connection;
  const mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster0.vtuubu9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
  // console.log(mongoUri);
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  db.on('error', (e) => {
    logger.error(new Error(`${e}`.red));
  });
  db.once('open', () => {
    logger.info(`Connected to DB : ${process.env.DB_NAME}`);
  });
  db.on('reconnectFailed', () => {
    logger.error(new Error('Reconnect Failed'.red.reset));
  });
  db.on('disconnected', () => {
    logger.error(new Error('Unable to connect to DB'.red.reset));
  });

};

module.exports = connectDB;
