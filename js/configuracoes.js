import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

const dashboardContent = document.getElementById('dashboardContent');
const tableBody = document.getElementById('tableBody');
const modalForm = document.getElementById('modalForm');
const dataForm = document.getElementById('dataForm');
const tabelaSelect = document.getElementById('tabelaSelect');
let currentCollection = tabelaSelect.value;

onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) { dashboardContent.classList.remove('hidden'); loadData(); }
    else { window.location.href = 'index.html'; }
});

tabelaSelect.addEventListener('change', (e) => {
    currentCollection = e.target.value;
    loadData();
});

async function loadData() {
    tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Carregando...</td></tr>';
    try {
        const colRef = collection(db, currentCollection);
        const snapshot = await getDocs(colRef);
        tableBody.innerHTML = '';
        if (snapshot.empty) { tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Nenhum registro encontrado.</td></tr>'; return; }
        
        snapshot.forEach(d => {
            const f = d.data();
            // Tenta adivinhar qual é o campo de texto descritivo baseado no legado ou genérico
            let textValue = f.valor || f.Valor || f.descricao || f.Descricao || f.nome || f.Nome || Object.values(f)[0] || '-';
            if (typeof textValue === 'object') textValue = JSON.stringify(textValue);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${textValue}</strong></td>
                <td class="action-btns" style="width: 100px;">
                    <button class="btn btn-outline del-btn" style="color:red;border-color:red;" data-id="${d.id}">Excluir</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm('Tem certeza que deseja excluir?')){ await deleteDoc(doc(db, currentCollection, e.target.getAttribute('data-id'))); loadData(); }
        }));
    } catch(e) {
        console.error(e);
        tableBody.innerHTML = '<tr><td colspan="2" class="text-center">Erro ao carregar dados.</td></tr>';
    }
}

document.getElementById('addBtn').addEventListener('click', () => { modalForm.classList.remove('hidden'); dataForm.reset(); });
document.getElementById('closeBtn').addEventListener('click', () => modalForm.classList.add('hidden'));

dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sb = document.getElementById('saveBtn'); sb.disabled = true;
    try {
        await addDoc(collection(db, currentCollection), {
            valor: document.getElementById('valorInput').value,
            createdAt: new Date().toISOString()
        });
        modalForm.classList.add('hidden'); loadData();
    } catch(err){} finally { sb.disabled = false; }
});
