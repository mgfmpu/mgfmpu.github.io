import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const dashboardContent = document.getElementById('dashboardContent');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');

import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
const db = getFirestore(app);

// Verifica autenticação
onAuthStateChanged(auth, async (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        // Usuário logado e autorizado
        dashboardContent.classList.remove('hidden');
        
        userName.textContent = user.displayName || 'Usuário Admin';
        userEmail.textContent = user.email;
        
        // Atualiza Avatar
        const nameForAvatar = user.displayName || user.email;
        userAvatar.textContent = nameForAvatar.charAt(0).toUpperCase();

        await loadDashboardStats();

    } else {
        // Não está logado ou não tem permissão
        window.location.href = 'index.html';
    }
});

async function loadDashboardStats() {
    try {
        // Carrega Membros
        const membrosSnap = await getDocs(collection(db, "membros"));
        document.getElementById('totalMembrosDash').textContent = membrosSnap.size;

        // Carrega Células
        const celulasSnap = await getDocs(collection(db, "celulas"));
        document.getElementById('totalCelulasDash').textContent = celulasSnap.size;

        // Carrega Congregações
        const igrejasSnap = await getDocs(collection(db, "igrejas"));
        document.getElementById('totalIgrejasDash').textContent = igrejasSnap.size;

    } catch (e) {
        console.error("Erro ao carregar estatísticas", e);
        document.getElementById('totalMembrosDash').textContent = "Erro";
        document.getElementById('totalCelulasDash').textContent = "Erro";
        document.getElementById('totalIgrejasDash').textContent = "Erro";
    }
}

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});
