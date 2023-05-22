const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearer = 'Bearer ';

  // Make sure token is present
  if (!authHeader || !authHeader.startsWith(bearer)) {
    return res.status(401).json({
      message: 'Access denied, No credentials sent!!',
    });
  }

  const token = authHeader.replace(bearer, '');

  jwt.verify(token, process.env.JWT_SECRET, async function (err, decoded) {
    if (err || !decoded) {
      return res.status(401).json({
        message: 'Error',
        details: 'Malformed JWT',
      });
    }
    const decod = decoded;
    const user = await User.findById(decod.id);
    if (!user) {
      return res.status(401).json({
        message: 'Error',
        details: 'No User found',
      });
    }
    req.user = user;
    next();
  });
};

// specific role can perform specific operations
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User of role ${req.user.role} is not authorized to perform this action`,
      });
    }
    next();
  };
};
