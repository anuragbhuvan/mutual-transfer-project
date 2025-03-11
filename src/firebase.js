// Import only needed functions
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD23_k99LEbOpJacbjmROWvHsw2vNYHlLI",
  authDomain: "true-energy-412306.firebaseapp.com",
  projectId: "true-energy-412306",
  storageBucket: "true-energy-412306.firebasestorage.app",
  messagingSenderId: "726326781717",
  appId: "1:726326781717:web:b2e01df20a5c133ad32b1c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export auth and db instances
export { auth, db };

// Export needed functions
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  setDoc,
  serverTimestamp
}; 