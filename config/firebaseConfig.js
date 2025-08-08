import { getApp, getApps, initializeApp } from "firebase/app";
// --- MODIFIED IMPORTS: Import functions for React Native persistence ---
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOZkAv4ziJhx48aeSHoa0H9OWaD2-kppg",
  authDomain: "senior-project-af27a.firebaseapp.com",
  projectId: "senior-project-af27a",
  storageBucket: "senior-project-af27a.firebasestorage.app",
  messagingSenderId: "87459278279",
  appId: "1:87459278279:web:e8906338e764344d747de2",
  measurementId: "G-S3VSC8W4TQ"
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
