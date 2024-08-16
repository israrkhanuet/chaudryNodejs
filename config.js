require('dotenv').config();

module.exports = {
  apiKey: process.env.CALENDARIFIC_API_KEY,
  calendarificUrl: 'https://calendarific.com/api/v2',
  cacheTtl: process.env.CACHE_TTL || 3600,  
};
