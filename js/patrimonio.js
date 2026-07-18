import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "bens_patrimoniais"); 
let currentEditId = null;

const dashboardContent = document.getElementById('dashboardContent');
const tableBody = document.getElementById('tableBody');
const modalForm = document.getElementById('modalForm');
const dataForm = document.getElementById('dataForm');

onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        dashboardContent.classList.remove('hidden');
        loadData();
    } else {
        window.location.href = 'index.html';
    }
});

async function loadData() {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(colRef);
        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum bem encontrado.</td></tr>'; return;
        }
        
        snapshot.forEach(docSnap => {
            const f = docSnap.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${f.Descricao || f.descricao || '-'}</strong></td>
                <td>${f.DataAquisao || f.dataAquisicao || '-'}</td>
                <td>${f.Tipo || f.tipo || '-'}</td>
                <td>R$ ${f.Valor_estimado || f.valorEstimado || '0.00'}</td>
                <td class="action-btns"><button class="btn-icon edit-btn" title="Editar" data-id="${d.id}" data-obj='${JSON.stringify(f).replace(/'/g, "&apos;")}'><i class="fas fa-edit"></i></button><button class="btn-icon del-btn" title="Excluir" data-id="${d.id}"><i class="fas fa-trash-alt"></i></button></td>
            `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Excluir?')) { await deleteDoc(doc(db, "bens_patrimoniais", e.target.getAttribute('data-id'))); loadData(); }
            });
        });
    } catch (e) { tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Erro.</td></tr>'; }
}

document.getElementById('addBtn').addEventListener('click', () => {
    modalForm.classList.remove('hidden'); dataForm.reset();
});
document.getElementById('closeBtn').addEventListener('click', () => modalForm.classList.add('hidden'));

dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn'); saveBtn.disabled = true;
    const dataObj = {
        descricao: document.getElementById('descricao').value,
        dataAquisicao: document.getElementById('dataAquisicao').value,
        valorEstimado: document.getElementById('valorEstimado').value,
        tipo: document.getElementById('tipo').value,
        situacao: document.getElementById('situacao').value
    };
    try {
        await addDoc(colRef, dataObj); modalForm.classList.add('hidden'); loadData();
    } catch (err) {} finally { saveBtn.disabled = false; }
});
