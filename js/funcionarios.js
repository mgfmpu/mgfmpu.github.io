import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "funcionarios");

onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) { document.getElementById('dashboardContent').classList.remove('hidden'); loadData(); }
    else { window.location.href = 'index.html'; }
});

async function loadData() {
    const tb = document.getElementById('tableBody');
    tb.innerHTML = '<tr><td colspan="4" class="text-center">Carregando...</td></tr>';
    try {
        const snap = await getDocs(colRef);
        tb.innerHTML = '';
        if (snap.empty) { tb.innerHTML = '<tr><td colspan="4" class="text-center">Vazio.</td></tr>'; return; }
        snap.forEach(d => {
            const f = d.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><strong>${f.Nome || f.nome || '-'}</strong></td><td>${f.Funcao || f.cargo || '-'}</td><td>${f.Telefone || f.telefone || '-'}</td>
                <td class="action-btns"><button class="btn btn-outline del-btn" style="color:red;border-color:red;" data-id="${d.id}">Excluir</button></td>`;
            tb.appendChild(tr);
        });
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm('Excluir?')){ await deleteDoc(doc(db, "funcionarios", e.target.getAttribute('data-id'))); loadData(); }
        }));
    } catch(e) {}
}

document.getElementById('addBtn').addEventListener('click', () => { document.getElementById('modalForm').classList.remove('hidden'); document.getElementById('dataForm').reset(); });
document.getElementById('closeBtn').addEventListener('click', () => document.getElementById('modalForm').classList.add('hidden'));

document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const sb = document.getElementById('saveBtn'); sb.disabled = true;
    try {
        await addDoc(colRef, { nome: document.getElementById('nome').value, cargo: document.getElementById('cargo').value, telefone: document.getElementById('telefone').value, endereco: document.getElementById('endereco').value });
        document.getElementById('modalForm').classList.add('hidden'); loadData();
    } catch(err){} finally { sb.disabled = false; }
});
