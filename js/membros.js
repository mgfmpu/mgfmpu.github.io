import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const membrosRef = collection(db, "membros");

// Elements
const dashboardContent = document.getElementById('dashboardContent');
const membrosTableBody = document.getElementById('membrosTableBody');
const membroModal = document.getElementById('membroModal');
const membroForm = document.getElementById('membroForm');
const addMembroBtn = document.getElementById('addMembroBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');

// Auth Check
onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        dashboardContent.classList.remove('hidden');
        loadMembros();
    } else {
        window.location.href = 'index.html';
    }
});

// Load Membros
async function loadMembros() {
    membrosTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(membrosRef);
        membrosTableBody.innerHTML = '';
        
        if (snapshot.empty) {
            membrosTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum membro cadastrado.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const m = docSnap.data();
            const id = docSnap.id;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${m.nome || '-'}</strong></td>
                <td>${m.cpf || '-'}</td>
                <td>${m.telefone || '-'}</td>
                <td><span style="background: var(--primary-color); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${m.cargo || 'Membro'}</span></td>
                <td class="action-btns">
                    <button class="btn btn-outline edit-btn" data-id="${id}" data-membro='${JSON.stringify(m)}'>Editar</button>
                    <button class="btn btn-outline del-btn" style="color: var(--error-color); border-color: var(--error-color);" data-id="${id}">Excluir</button>
                </td>
            `;
            membrosTableBody.appendChild(tr);
        });

        // Add Listeners to buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const data = JSON.parse(e.target.getAttribute('data-membro'));
                openModal(id, data);
            });
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Tem certeza que deseja excluir este membro?')) {
                    const id = e.target.getAttribute('data-id');
                    await deleteDoc(doc(db, "membros", id));
                    loadMembros();
                }
            });
        });

    } catch (e) {
        console.error("Erro ao carregar membros: ", e);
        membrosTableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--error-color)">Erro ao carregar. Verifique regras do Firestore.</td></tr>';
    }
}

// Modal Logic
function openModal(id = null, data = null) {
    membroModal.classList.remove('hidden');
    membroForm.reset();
    
    if (id && data) {
        modalTitle.textContent = 'Editar Membro';
        document.getElementById('membroId').value = id;
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('cpf').value = data.cpf || '';
        document.getElementById('dataNasc').value = data.dataNasc || '';
        document.getElementById('sexo').value = data.sexo || 'M';
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('cargo').value = data.cargo || 'Membro';
    } else {
        modalTitle.textContent = 'Cadastrar Membro';
        document.getElementById('membroId').value = '';
    }
}

addMembroBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', () => membroModal.classList.add('hidden'));

// Save Data
membroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Salvando...';
    saveBtn.disabled = true;

    const membroData = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        dataNasc: document.getElementById('dataNasc').value,
        sexo: document.getElementById('sexo').value,
        telefone: document.getElementById('telefone').value,
        cargo: document.getElementById('cargo').value,
        updatedAt: new Date().toISOString()
    };

    const id = document.getElementById('membroId').value;
    try {
        if (id) {
            await updateDoc(doc(db, "membros", id), membroData);
        } else {
            membroData.createdAt = new Date().toISOString();
            await addDoc(membrosRef, membroData);
        }
        membroModal.classList.add('hidden');
        loadMembros();
    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert('Erro ao salvar. Verifique se as regras do Firestore permitem gravação.');
    } finally {
        saveBtn.textContent = 'Salvar Membro';
        saveBtn.disabled = false;
    }
});
