import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDaHZUsvE852dJlija_ym6yk18s64K3TrY",
  authDomain: "food-rescui-ai.firebaseapp.com",
  projectId: "food-rescui-ai",
  storageBucket: "food-rescui-ai.firebasestorage.app",
  messagingSenderId: "1074057425422",
  appId: "1:1074057425422:web:da33381e389b875d3a425f"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { auth, db };
