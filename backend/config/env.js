const dotenv = require('dotenv')
dotenv.config({ path: '../.env'});

module.exports ={
    PORT: process.env.PORT || 3000,
    MONGO_URI: process.env.MONGO_URI || null,
    JWT_SECRET: process.env.JWT_SECRET || 'jwt_password',
    jwtExpiresIn: process.env.jwtExpiresIn || '1 hour'
}