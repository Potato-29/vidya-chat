// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQwqnorS7fUOep4BHuXrYIVo4KLzZMYw0",
  authDomain: "vidyo-chat.firebaseapp.com",
  projectId: "vidyo-chat",
  storageBucket: "vidyo-chat.firebasestorage.app",
  messagingSenderId: "262206575526",
  appId: "1:262206575526:web:2f071940f8cc07a490f567",
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
export { firebaseApp, firestore };
