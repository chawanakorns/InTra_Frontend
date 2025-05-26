// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOZkAv4ziJhx48aeSHoa0H9OWaD2-kppg",
  authDomain: "senior-project-af27a.firebaseapp.com",
  projectId: "senior-project-af27a",
  storageBucket: "senior-project-af27a.firebasestorage.app",
  messagingSenderId: "87459278279",
  appId: "1:87459278279:web:e8906338e764344d747de2",
  measurementId: "G-S3VSC8W4TQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
