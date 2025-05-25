
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if you need analytics

const firebaseConfig = {
  apiKey: "AIzaSyDYrRsXg27Q2TWatbH05GiN5deU5BpITI",
  authDomain: "sewasathi-1076b.firebaseapp.com",
  projectId: "sewasathi-1076b",
  storageBucket: "sewasathi-1076b.firebasestorage.app",
  messagingSenderId: "435729160797",
  appId: "1:435729160797:web:2d8107b3357a63c7048bb4",
  measurementId: "G-GQDBZ1T230",
  // The databaseURL is required for Realtime Database
  databaseURL: "https://sewasathi-1076b-default-rtdb.firebaseio.com"
};

let app: FirebaseApp;
let auth: Auth;
let database: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
database = getDatabase(app);

// const analytics = getAnalytics(app); // Uncomment if you need analytics

export { app, auth, database };
