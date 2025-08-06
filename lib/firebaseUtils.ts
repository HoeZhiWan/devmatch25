import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAhfsOSLGNk5S-SXYxvlTIFyLiJ1i3iP9k",
    authDomain: "apu-watnameleh.firebaseapp.com",
    projectId: "apu-watnameleh",
    storageBucket: "apu-watnameleh.firebasestorage.app",
    messagingSenderId: "966069106843",
    appId: "1:966069106843:web:92dfe8702b8e079c53ee3e",
    measurementId: "G-K19JQ6ZBRJ"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

export { firebaseApp, db };