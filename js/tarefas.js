import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "controle_tarefas");

onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) { document.getElementById('dashboardContent').classList.remove('hidden'); loadData(); }
    else { window.location.href = 'index.html'; }
});

async function loadData() {
    const tb = document.getElementById('tableBody');
    tb.innerHTML = '<tr><td colspan="3" class="text-center">Carregando...</td></tr>';
    try {
        const snap = await getDocs(colRef);
        tb.innerHTML = '';
        if (snap.empty) { tb.innerHTML = '<tr><td colspan="3" class="text-center">Vazio.</td></tr>'; return; }
        snap.forEach(d => {
            const f = d.data();
            const vals = Object.values(f);
            let c1 = vals[0] || f.Nome || f.Titulo || f.nome || f.titulo || f.Tarefa || f.tarefa || '-';
            let c2 = vals[1] || f.Telefone || f.telefone || f.Data || f.data || f.Email || f.email || '-';
            if (typeof c1 === 'object') c1 = '-'; if (typeof c2 === 'object') c2 = '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><strong>${c1}</strong></td><td>${c2}</td>
                <td class="action-btns" style="width: 100px;"><button class="btn btn-outline del-btn" style="color:red;border-color:red;" data-id="${d.id}">Excluir</button></td>`;
            tb.appendChild(tr);
        });
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm('Excluir?')){ await deleteDoc(doc(db, "controle_tarefas", e.target.getAttribute('data-id'))); loadData(); }
        }));
    } catch(e) {}
}

document.getElementById('addBtn').addEventListener('click', () => { document.getElementById('modalForm').classList.remove('hidden'); document.getElementById('dataForm').reset(); });
document.getElementById('closeBtn').addEventListener('click', () => document.getElementById('modalForm').classList.add('hidden'));

document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const sb = document.getElementById('saveBtn'); sb.disabled = true;
    try {
        await addDoc(colRef, { campo1: document.getElementById('campo1').value, campo2: document.getElementById('campo2').value, createdAt: new Date().toISOString() });
        document.getElementById('modalForm').classList.add('hidden'); loadData();
    } catch(err){} finally { sb.disabled = false; }
});