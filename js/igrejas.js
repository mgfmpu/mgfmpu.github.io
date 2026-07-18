import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "igrejas");
const dashboardContent = document.getElementById('dashboardContent');
const tableBody = document.getElementById('tableBody');
const modalForm = document.getElementById('modalForm');
const dataForm = document.getElementById('dataForm');

onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) { dashboardContent.classList.remove('hidden'); loadData(); }
    else { window.location.href = 'index.html'; }
});

async function loadData() {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(colRef);
        tableBody.innerHTML = '';
        if (snapshot.empty) { tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma congregação.</td></tr>'; return; }
        
        snapshot.forEach(d => {
            const f = d.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${f.Igreja || f.igrejaNome || '-'}</strong></td>
                <td>${f.DirigenteResponsavel || f.dirigente || '-'}</td>
                <td>${f.Telefone1 || f.telefone || '-'}</td>
                <td>${f.Cidade || f.cidade || ''}/${f.UF || f.uf || ''}</td>
                <td class="action-btns"><button class="btn btn-outline del-btn" style="color:red;border-color:red;" data-id="${d.id}">Excluir</button></td>
            `;
            tableBody.appendChild(tr);
        });
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm('Excluir?')){ await deleteDoc(doc(db, "igrejas", e.target.getAttribute('data-id'))); loadData(); }
        }));
    } catch(e) {}
}

document.getElementById('addBtn').addEventListener('click', () => { modalForm.classList.remove('hidden'); dataForm.reset(); });
document.getElementById('closeBtn').addEventListener('click', () => modalForm.classList.add('hidden'));

dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sb = document.getElementById('saveBtn'); sb.disabled = true;
    try {
        await addDoc(colRef, {
            igrejaNome: document.getElementById('igrejaNome').value,
            dirigente: document.getElementById('dirigente').value,
            cnpj: document.getElementById('cnpj').value,
            telefone: document.getElementById('telefone').value,
            dataFundacao: document.getElementById('dataFundacao').value,
            endereco: document.getElementById('endereco').value,
            cidade: document.getElementById('cidade').value,
            uf: document.getElementById('uf').value
        });
        modalForm.classList.add('hidden'); loadData();
    } catch(err){} finally { sb.disabled = false; }
});
