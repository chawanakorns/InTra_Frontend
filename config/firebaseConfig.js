import { getApp, getApps, initializeApp } from "firebase/app";
// --- MODIFIED IMPORTS: Import functions for React Native persistence ---
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCde5LTUXjmGqN1gPY81EFcn_aTiyW2Djs",
  authDomain: "intra-2057d.firebaseapp.com",
  projectId: "intra-2057d",
  storageBucket: "intra-2057d.appspot.com",
  messagingSenderId: "564971518526",
  appId: "1:564971518526:web:2aabe06027b9f63c6eef6f",
  measurementId: "G-208E0TXML2"
};

// Singleton pattern to initialize Firebase app (This part is correct)
function initializeFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
}

const app = initializeFirebaseApp();

// --- THIS IS THE CRITICAL FIX ---
// Instead of getAuth, we use initializeAuth and provide AsyncStorage for persistence.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Export the correctly configured auth object
export { auth };

