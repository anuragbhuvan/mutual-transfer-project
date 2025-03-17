// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { 
  getFirestore,
  doc, 
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  getDoc,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Flag to track if Firebase is fully initialized
let isFirebaseReady = false;

// Complete the initialization process asynchronously
const completeFirebaseSetup = async () => {
  try {
    console.log('Firebase app initialized');

    // Set persistence to local
    await setPersistence(auth, browserLocalPersistence);
    console.log('Auth initialized with local persistence');

    // Test database connection with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const testCollection = collection(db, 'users');
        await getDocs(testCollection);
        console.log('Database connection successful');
        isFirebaseReady = true;
        break;
      } catch (error) {
        retryCount++;
        console.error(`Database connection attempt ${retryCount} failed:`, error.message);
        if (retryCount === maxRetries) {
          throw new Error('Database connection failed after multiple attempts. Please check Firebase Console settings.');
        }
        // Wait for 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Set up auth state listener with error handling
    onAuthStateChanged(auth, 
      async (user) => {
        if (user) {
          console.log('User is signed in');
          try {
            // Create or update user document
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              lastLogin: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
            
            console.log('User document updated successfully');
          } catch (error) {
            console.error('Auth state update failed:', error.message);
            // Don't throw here, just log the error
          }
        } else {
          console.log('No user is signed in');
        }
      },
      (error) => {
        console.error('Auth state change error:', error.message);
        // Don't throw here, just log the error
      }
    );

  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    // Set isFirebaseReady to false on error
    isFirebaseReady = false;
    throw error;
  }
};

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  display: 'popup'
});

// Complete Firebase setup in background
completeFirebaseSetup().catch(console.error);

// Handle Google Sign In
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Update user document
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    return user;
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled by user');
    }
    console.error('Error during Google sign-in:', error);
    throw error;
  }
};

// Export the functions
export { 
  auth, 
  db,
  isFirebaseReady,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  doc,
  setDoc,
  serverTimestamp,
  signInWithGoogle
}; 