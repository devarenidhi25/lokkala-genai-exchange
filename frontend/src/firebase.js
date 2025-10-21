import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBwCUaQpNeh6BccgNY-Lknz9Sw_YTy4bg0",
  authDomain: "gen-ai-exchange-hackatho-548d0.firebaseapp.com",
  projectId: "gen-ai-exchange-hackatho-548d0",
  storageBucket: "gen-ai-exchange-hackatho-548d0.firebasestorage.app",
  messagingSenderId: "919473869598",
  appId: "1:919473869598:web:0e8970671580b6e84d2f0f",
  measurementId: "G-69Y9X1YZLG"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, storage, googleProvider };