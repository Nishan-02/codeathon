import { initializeApp, getApps, getApp } from 'firebase/app';
import { CONFIG } from '../../constants/config';

const firebaseConfig = {
  apiKey: CONFIG.FIREBASE.apiKey,
  authDomain: CONFIG.FIREBASE.authDomain,
  projectId: CONFIG.FIREBASE.projectId,
  storageBucket: CONFIG.FIREBASE.storageBucket,
  messagingSenderId: CONFIG.FIREBASE.messagingSenderId,
  appId: CONFIG.FIREBASE.appId,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
