import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHk6ZJ__kPqF6ybApSn4IRgV50tF3x-g8",
  authDomain: "grandlux.firebaseapp.com",
  projectId: "grandlux",
  storageBucket: "grandlux.firebasestorage.app",
  messagingSenderId: "225062139528",
  appId: "1:225062139528:web:1047606d9a72b0e34e513d",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
