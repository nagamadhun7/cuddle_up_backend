// cloudinary.js
require('dotenv').config(); // Load environment variables from .env file

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

module.exports = cloudinary;
