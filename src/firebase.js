// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  onSnapshot
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDI4Vt_wWDoorQjroBSMav-yCGlhtoiHjY",
  authDomain: "doce-e-ser-de1f6.firebaseapp.com",
  databaseURL: "https://doce-e-ser-de1f6-default-rtdb.firebaseio.com",
  projectId: "doce-e-ser-de1f6",
  storageBucket: "doce-e-ser-de1f6.firebasestorage.app",
  messagingSenderId: "1021515521250",
  appId: "1:1021515521250:web:c07acb32b18bec05d512bb"
};

const app = initializeApp(firebaseConfig);

// Exporta db e auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Exporta TODAS as funções Firestore usadas no app
export {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  onSnapshot
};
