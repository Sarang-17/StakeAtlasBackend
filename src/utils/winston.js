// * Packages
const { createLogger, format, transports } = require('winston');
const LokiTransport = require('winston-loki');
const { combine, timestamp, prettyPrint, json, colorize, align, printf } =
  format;

require('winston-daily-rotate-file');
require('dotenv').config();

// Utils
const NODE_ENV = process.env.NODE_ENV || 'development';

const myformat = combine(
  colorize(),
  timestamp(),
  align(),
  printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

const ServerTransport = new transports.DailyRotateFile({
  filename: './logs/server-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  level: 'info',
  format: combine(json(), timestamp(), prettyPrint()),
});

const ErrorTransport = new transports.DailyRotateFile({
  filename: './logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  format: combine(json(), timestamp(), prettyPrint()),
  level: 'error',
});

const DebugTransport = new transports.DailyRotateFile({
  filename: './logs/debug-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  format: combine(json(), timestamp(), prettyPrint()),
  level: 'debug',
});

const logger = new createLogger({
  transports: [
    ServerTransport,
    ErrorTransport,
    DebugTransport,
    new transports.Console({
      level: NODE_ENV === 'production' ? 'info' : 'debug',
      handleExceptions: true,
      format: myformat,
    }),
    new LokiTransport({
      host: 'http://loki:3100',
      json: true,
      labels: { job: 'socket-gateway' },
    }),
  ],
  exitOnError: false,
});

logger.stream = {
  write(message) {
    logger.info(message);
  },
};

module.exports = logger;
