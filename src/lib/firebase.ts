
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if you need analytics

const firebaseConfig = {
  apiKey: "AIzaSyBP8Bm2gadbht0gClE6PGKjqC76JgrWY4M",
  authDomain: "sewasathi-1076b.firebaseapp.com",
  projectId: "sewasathi-1076b",
  storageBucket: "sewasathi-1076b.firebasestorage.app",
  messagingSenderId: "435729160797",
  appId: "1:435729160797:web:06be7d7d52319271048bb4",
  measurementId: "G-SEH6GJJM97",
  // The databaseURL is required for Realtime Database
  databaseURL: "https://sewasathi-1076b-default-rtdb.asia-southeast1.firebasedatabase.app"
};

let app: FirebaseApp;
let auth: Auth;
let database: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized for the first time.");
} else {
  app = getApps()[0];
  console.log("Firebase app already initialized.");
}

auth = getAuth(app);
database = getDatabase(app);
console.log("Firebase Database SDK initialized:", database); // Diagnostic log

export { app, auth, database };
