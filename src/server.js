const express = require('express');
const cors = require('cors');
const dns = require('dns');
const env = require('dotenv');
const fileUpload = require('express-fileupload');
const logger = require('./utils/winston');

const app = express();

env.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// #region CONNECTIVITY CHECK
dns.lookup('www.google.com', (err) => {
  if (err) {
    logger.error('Error connecting google, no internet'.req.bold);
    process.exit();
  } else {
    logger.info('Successfully connected to internet'.green);
  }
});
// #endregion

// #region MONGOOSE CONNECTION
const connectDB = require('./config/connectDB');
connectDB();
// #endregion

// #region using fileUpload
app.use(
  fileUpload({
    useTempFiles: true,
    limits: {
      fileSize: 1024 * 1024,
    },
  })
);
// #endRegion

// #region LOGGER
app.use((req, res, next) => {
  const irequest = '' + req.method + ' ' + req.url + ' ' + res.statusCode;
  logger.info(irequest.blue);
  const myarray = req.url.split('/');
  if (
    myarray[1] === 'profilePhoto' ||
    myarray[1] === 'products' ||
    myarray[1] === 'documents'
  ) {
    res.download('.' + req.url);
  } else {
    next();
  }
});
// #endregion

// #region CHECK
app.get('/', function (req, res) {
  res.send('Welcome to E-Comm by Credanic');
});
// #endregion

// #region ADD & MOUNT ROUTES
const auth = require('./routes/auth.route');
const product = require('./routes/product.route');
const admin = require('./routes/admin.route');
const cart = require('./routes/cart.route');
const order = require('./routes/order.route');
const review = require('./routes/review.route');
const qNa = require('./routes/qNa.route');
const makeOffer = require('./routes/makeOffer.route');
const coupon = require('./routes/coupon.route');

app.use('/api/v1/auth', auth);
app.use('/api/v1/admin', admin);
app.use('/api/v1/product', product);
app.use('/api/v1/cart', cart);
app.use('/api/v1/order', order);
app.use('/api/v1/review', review);
app.use('/api/v1/qna', qNa);
app.use('/api/v1/makeOffer', makeOffer);
app.use('/api/v1/coupon', coupon);
// #endregion

// #region errorHandler
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);
// #endregion

// #region  PORT CONFIGURATION
const PORT = process.env.PORT || 7000;
const server = app.listen(PORT, () => {
  logger.info(`App listening on port ${PORT}`);
});

// Handle Unhadled Promise rejections
process.on('unhandledRejection', (err, Promise) => {
  logger.error(`Error unhandled rejection: ${err}`.red);
  // Close server and exit with 1
  server.close(() => process.exit(1));
});
// #endregion
