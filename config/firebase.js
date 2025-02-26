const admin = require("firebase-admin");

// Load credentials from environment variables
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cuddleup-21617.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
