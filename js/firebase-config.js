import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: Substitua pelas configurações do seu projeto no Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
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

export { auth, googleProvider, authorizedEmails };
