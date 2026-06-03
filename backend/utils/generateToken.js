const jwt = require('jsonwebtoken');
const config = require('../config/env.js');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    config.JWT_SECRET,
    { expiresIn: config.jwtExpiresIn }
  );
};

module.exports = generateToken