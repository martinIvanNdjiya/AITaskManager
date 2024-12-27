// firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBD96XiVx1OVi0_1gt9Tnm3zl0p-EiMCr4",
  authDomain: "cours-web-e98f6.firebaseapp.com",
  projectId: "cours-web-e98f6",
  storageBucket: "cours-web-e98f6.appspot.com",
  messagingSenderId: "457652857985",
  appId: "1:457652857985:web:c44e709098b303ac26f180",
  measurementId: "G-VV53WXY2PP"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();


export { db, storage, auth, googleProvider, githubProvider };