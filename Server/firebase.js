const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json'); // Sesuaikan dengan path file Anda

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://projek-inventaris-default-rtdb.asia-southeast1.firebasedatabase.app/' 
});

const db = admin.database();

module.exports = db;