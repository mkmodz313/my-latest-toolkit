import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  getFirestore 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Real-world high-performance Firebase configuration supplied by user
const firebaseConfig = {
  apiKey: "AIzaSyCnQQ3AmUjrai46R5a-Vav5_-Bl_Ycbw4c",
  authDomain: "mkmo-e429c.firebaseapp.com",
  databaseURL: "https://mkmo-e429c-default-rtdb.firebaseio.com",
  projectId: "mkmo-e429c",
  storageBucket: "mkmo-e429c.firebasestorage.app",
  messagingSenderId: "171950279910",
  appId: "1:171950279910:web:448d9d337d686300a9bf27",
  measurementId: "G-C727PCL01R"
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// HIGH-PERFORMANCE PERSISTENT CLIENT CACHE
// This is the absolute best solution for the "data doesn't load quickly" issue.
// By configuring persistentLocalCache with a multiple-tab manager, Firestore
// caches all fetched data (including the admin features) directly into IndexedDB.
// On next application boot, Firestore reads from local cache INSTANTLY (0ms latency)
// before completing the network roundtrip, updating the UI dynamically if changes occur.
let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (error) {
  console.warn("Persistent cache or IndexedDB is blocked (typical in restricted browser iframes). Falling back to basic Firestore.", error);
  db = getFirestore(app);
}

const rtdb = getDatabase(app);
const auth = getAuth(app);

export { app, db, rtdb, auth };
