
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
// import { getAnalytics } from "firebase/analytics"; // Uncomment if you need analytics

const firebaseConfig = {
  apiKey: "AIzaSyBP8Bm2gadbht0gClE6PGKjqC76JgrWY4M", // Updated
  authDomain: "sewasathi-1076b.firebaseapp.com",
  projectId: "sewasathi-1076b",
  storageBucket: "sewasathi-1076b.firebasestorage.app",
  messagingSenderId: "435729160797",
  appId: "1:435729160797:web:06be7d7d52319271048bb4", // Updated
  measurementId: "G-SEH6GJJM97", // Updated
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

// const analytics = getAnalytics(app); // Uncomment if you need analytics. Note: You had `getAnalytics` imported but not assigned if this new snippet is the sole source. Keeping it commented as per original structure.

export { app, auth, database };
