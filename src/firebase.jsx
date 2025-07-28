// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBc4CZnGGOTDvfPvEwaA0dXFOwbocdwCa8",
  authDomain: "knowurfood-d2b78.firebaseapp.com",
  projectId: "knowurfood-d2b78",
  storageBucket: "knowurfood-d2b78.firebasestorage.app",
  messagingSenderId: "643565214463",
  appId: "1:643565214463:web:8681aadcc4f49c6afdcaca",
  measurementId: "G-HB4L7NXGNE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// ✅ Modern persistent Firestore initialization (replaces deprecated persistence method)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { db, auth };
