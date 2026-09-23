const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configure DNS to resolve MongoDB Atlas SRV records reliably on all networks/Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Fallback to default
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://diwateyash2004_db_user:admin123@cluster0.cxer5y3.mongodb.net/examdesk?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: 'examdesk', // Dedicated separate database
      serverSelectionTimeoutMS: 10000
    });

    isConnected = true;
    console.log(`=========================================`);
    console.log(`  MongoDB Atlas Connected Successfully!  `);
    console.log(`  Database: ${conn.connection.name}      `);
    console.log(`=========================================`);
  } catch (err) {
    console.error('MongoDB Atlas Connection Error:', err.message);
    throw err;
  }
}

module.exports = {
  connectDB,
  mongoose
};
