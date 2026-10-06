export const CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBEjZnURBSDbIB6uUYFNueqLkIZ0tGxI9A',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'studypilot-30a07.firebaseapp.com',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'studypilot-30a07',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'studypilot-30a07.firebasestorage.app',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '719359573419',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:719359573419:web:4683cc92cf26fcd835a6ee',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-KT5G3EVDRM',
  },
};
