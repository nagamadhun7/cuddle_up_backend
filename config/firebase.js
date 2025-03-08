// const admin = require("firebase-admin");
// const serviceAccount = require("./cuddleup-21617-firebase-adminsdk-fbsvc-8a9a6a7826.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://cuddleup-21617.firebaseio.com"
// });

// const db = admin.firestore();

// module.exports = { admin, db };


const admin = require("firebase-admin");

// Load credentials from environment variables
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cuddleup-21617.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
