import { auth, googleProvider, authorizedEmails } from './firebase-config.js';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const alertBox = document.getElementById('alertBox');

function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    setTimeout(() => { alertBox.className = 'alert hidden'; }, 5000);
}

function checkAuthorization(user) {
    // Se o usuário é o email fictício mgf@mpu.com (ou outro email na lista de autorizados), prossegue.
    if (authorizedEmails.includes(user.email)) {
        window.location.href = 'dashboard.html';
    } else {
        // Se não está na lista de autorizados, desloga e mostra erro
        signOut(auth).then(() => {
            showAlert('Este e-mail não tem permissão para acessar o painel.', 'error');
        });
    }
}

// Escuta mudanças na autenticação para redirecionar se já estiver logado
onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        window.location.href = 'dashboard.html';
    }
});

// Login com E-mail e Senha
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Carregando...';
    btn.disabled = true;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            checkAuthorization(user);
        })
        .catch((error) => {
            console.error(error.code, error.message);
            if (error.code === 'auth/invalid-credential') {
                showAlert('E-mail ou senha incorretos.');
            } else {
                showAlert('Erro ao fazer login: ' + error.message);
            }
            btn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg> Entrar';
            btn.disabled = false;
        });
});

// Login com Conta Google
googleLoginBtn.addEventListener('click', () => {
    const originalText = googleLoginBtn.innerHTML;
    googleLoginBtn.textContent = 'Carregando...';
    googleLoginBtn.disabled = true;

    signInWithPopup(auth, googleProvider)
        .then((result) => {
            const user = result.user;
            checkAuthorization(user);
        })
        .catch((error) => {
            console.error(error.code, error.message);
            showAlert('Erro ao fazer login com o Google.');
            googleLoginBtn.innerHTML = originalText;
            googleLoginBtn.disabled = false;
        });
});
