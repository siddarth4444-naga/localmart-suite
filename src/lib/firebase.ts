import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyALqdHliN2yhIaNC-bUGU6MPgft_lQS0EM",
  authDomain: "localmart-964ea.firebaseapp.com",
  projectId: "localmart-964ea",
  storageBucket: "localmart-964ea.firebasestorage.app",
  messagingSenderId: "791098859041",
  appId: "1:791098859041:web:51a01f3d8a32cee1258d60",
  measurementId: "G-N0N6JWFCQ4"
};

// Initialize Firebase App instance singleton
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);

export {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  ConfirmationResult
};
