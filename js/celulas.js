import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const celulasRef = collection(db, "celulas");

// Elementos
const dashboardContent = document.getElementById('dashboardContent');
const celulasTableBody = document.getElementById('celulasTableBody');
const celulaModal = document.getElementById('celulaModal');
const celulaForm = document.getElementById('celulaForm');
const addCelulaBtn = document.getElementById('addCelulaBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');

// Autenticação
onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        dashboardContent.classList.remove('hidden');
        loadCelulas();
    } else {
        window.location.href = 'index.html';
    }
});

// Carregar Dados
async function loadCelulas() {
    celulasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(celulasRef);
        celulasTableBody.innerHTML = '';
        
        if (snapshot.empty) {
            celulasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma célula encontrada.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            // Dados legados e novos
            const nome = data.NomeCelula || data.nomeCelula || '-';
            const responsavel = data.Responsavel || data.responsavel || '-';
            const dias = data.DiasReunioes || data.diasReunioes || '-';
            const horario = data.HorarioReunioes || data.horarioReunioes || '-';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${nome}</strong></td>
                <td>${responsavel}</td>
                <td>${dias}</td>
                <td>${horario}</td>
                <td class="action-btns">
                    <button class="btn-icon edit-btn" title="Editar" data-id="${d.id}" data-obj='${JSON.stringify(f).replace(/'/g, "&apos;")}'><i class="fas fa-edit"></i></button><button class="btn-icon del-btn" title="Excluir" data-id="${d.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            celulasTableBody.appendChild(tr);
        });

        // Listeners de Excluir
        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Tem certeza que deseja excluir esta célula?')) {
                    const id = e.target.getAttribute('data-id');
                    await deleteDoc(doc(db, "celulas", id));
                    loadCelulas();
                }
            });
        });

    } catch (e) {
        console.error("Erro ao carregar celulas: ", e);
        celulasTableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--error-color)">Erro ao carregar dados.</td></tr>';
    }
}

// Modal
function openModal() {
    celulaModal.classList.remove('hidden');
    celulaForm.reset();
    document.getElementById('celulaId').value = '';
}

addCelulaBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', () => celulaModal.classList.add('hidden'));

// Salvar
celulaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Salvando...';
    saveBtn.disabled = true;

    const dataObj = {
        nomeCelula: document.getElementById('nomeCelula').value,
        responsavel: document.getElementById('responsavel').value,
        diasReunioes: document.getElementById('diasReunioes').value,
        horarioReunioes: document.getElementById('horarioReunioes').value,
        endereco: document.getElementById('endereco').value,
        updatedAt: new Date().toISOString()
    };

    try {
        dataObj.createdAt = new Date().toISOString();
        if (currentEditId) {
            const docRef = doc(db, colRef ? colRef.id : currentCollection, currentEditId);
            await updateDoc(docRef, await addDoc(celulasRef, dataObj).match(/,s*({[^]+?}))/)[1]);
        } else {
            await addDoc(celulasRef, dataObj);
        }
        celulaModal.classList.add('hidden');
        loadCelulas();
    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert('Erro ao salvar célula.');
    } finally {
        saveBtn.textContent = 'Salvar';
        saveBtn.disabled = false;
    }
});
