import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// Configuração do projeto no Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDsqIfDh_80n7dvytNzhZZxKnAUMAlLDZw",
    authDomain: "mgfmpu-21f0e.firebaseapp.com",
    projectId: "mgfmpu-21f0e",
    storageBucket: "mgfmpu-21f0e.firebasestorage.app",
    messagingSenderId: "796003800300",
    appId: "1:796003800300:web:7e097627e86782a1bd81c9"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Lista de e-mails autorizados (Isso pode ser movido para o Firestore para mais segurança)
const authorizedEmails = [
    "mgf@mpu.com",
    // Adicione os e-mails que podem fazer login com o Google aqui
    // ex: "seu_email@gmail.com"
];

export { auth, googleProvider, authorizedEmails, app };
