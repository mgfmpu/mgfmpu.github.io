import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "agenda");

const dashboardContent = document.getElementById('dashboardContent');
const tableBody = document.getElementById('tableBody');
const modalForm = document.getElementById('modalForm');
const dataForm = document.getElementById('dataForm');
const addBtn = document.getElementById('addBtn');
const closeBtn = document.getElementById('closeBtn');
const modalTitle = document.getElementById('modalTitle');

onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        dashboardContent.classList.remove('hidden');
        loadData();
    } else {
        window.location.href = 'index.html';
    }
});

async function loadData() {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(colRef);
        tableBody.innerHTML = '';
        
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum compromisso encontrado.</td></tr>';
            return;
        }

        let docs = [];
        snapshot.forEach(d => docs.push({...d.data(), id: d.id}));

        docs.sort((a, b) => {
            const da = a.Data || a.data || '';
            const db = b.Data || b.data || '';
            return db.localeCompare(da);
        });

        docs.forEach(f => {
            const dataF = f.Data || f.data || '-';
            const horario = f.Horario || f.horario || '';
            const assunto = f.Assunto || f.assunto || '-';
            const prioridade = f.Prioridade || f.prioridade || '3';
            
            let pText = 'Baixa';
            if (prioridade == '1') pText = 'Alta';
            else if (prioridade == '2') pText = 'Média';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataF} ${horario}</td>
                <td><strong>${assunto}</strong></td>
                <td><span class="badge badge-${prioridade}">${pText}</span></td>
                <td class="action-btns">
                    <button class="btn btn-outline del-btn" style="color: var(--error-color); border-color: var(--error-color);" data-id="${f.id}">Excluir</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Excluir?')) {
                    await deleteDoc(doc(db, "agenda", e.target.getAttribute('data-id')));
                    loadData();
                }
            });
        });
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--error-color)">Erro.</td></tr>';
    }
}

function openModal() {
    modalForm.classList.remove('hidden');
    dataForm.reset();
    document.getElementById('docId').value = '';
}
addBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', () => modalForm.classList.add('hidden'));

dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Salvando...'; saveBtn.disabled = true;

    const dataObj = {
        assunto: document.getElementById('assunto').value,
        data: document.getElementById('data').value,
        horario: document.getElementById('horario').value,
        prioridade: document.getElementById('prioridade').value,
        tarefa: document.getElementById('tarefa').value,
        updatedAt: new Date().toISOString()
    };
    try {
        await addDoc(colRef, dataObj);
        modalForm.classList.add('hidden');
        loadData();
    } catch (err) { alert('Erro'); }
    finally { saveBtn.textContent = 'Salvar'; saveBtn.disabled = false; }
});
