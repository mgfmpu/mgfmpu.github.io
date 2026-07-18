import { auth, authorizedEmails } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const dashboardContent = document.getElementById('dashboardContent');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');

// Verifica autenticação
onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        // Usuário logado e autorizado
        dashboardContent.classList.remove('hidden');
        
        userName.textContent = user.displayName || 'Usuário Admin';
        userEmail.textContent = user.email;
        
        // Atualiza Avatar (Pega inicial do email se não tiver nome)
        const nameForAvatar = user.displayName || user.email;
        userAvatar.textContent = nameForAvatar.charAt(0).toUpperCase();

    } else {
        // Não está logado ou não tem permissão
        window.location.href = 'index.html';
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});
