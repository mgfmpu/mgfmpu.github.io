import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "contatos"); 
let currentEditId = null;

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
            let c1 = f.Pessoa_Empresa || obj.nome || '-';
            let c2 = f.Telefone_1 || obj.telefone || '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><strong>${c1}</strong></td><td>${c2}</td>
                <td class="action-btns" style="width: 100px;"><button class="btn-icon edit-btn" title="Editar" data-id="${d.id}" data-obj='${JSON.stringify(f).replace(/'/g, "&apos;")}'><i class="fas fa-edit"></i></button><button class="btn-icon del-btn" title="Excluir" data-id="${d.id}"><i class="fas fa-trash-alt"></i></button></td>`;
            tb.appendChild(tr);
        });
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm('Excluir?')){ await deleteDoc(doc(db, "contatos", e.target.getAttribute('data-id'))); loadData(); }
        }));

        document.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', (e) => {
            const btn = e.target.closest('.edit-btn');
            if(!btn) return;
            currentEditId = btn.getAttribute('data-id');
            const obj = JSON.parse(btn.getAttribute('data-obj'));
            
            // Try to map object values to inputs automatically
            const inputs = Array.from(document.querySelectorAll('#dataForm input:not([type="hidden"]):not([type="submit"])'));
            
            // If it's a specific page like funcionarios, we might need to map by name/id
            // But generically, we can try to guess or just map the first few values
            if (obj.nome !== undefined && document.getElementById('nome')) document.getElementById('nome').value = obj.nome;
            if (obj.cargo !== undefined && document.getElementById('cargo')) document.getElementById('cargo').value = obj.cargo;
            if (obj.telefone !== undefined && document.getElementById('telefone')) document.getElementById('telefone').value = obj.telefone;
            if (obj.endereco !== undefined && document.getElementById('endereco')) document.getElementById('endereco').value = obj.endereco;
            
            // For generic generated pages:
            if (document.getElementById('campo1')) document.getElementById('campo1').value = Object.values(obj)[0] || '';
            if (document.getElementById('campo2')) document.getElementById('campo2').value = Object.values(obj)[1] || '';
            if (document.getElementById('valorInput')) document.getElementById('valorInput').value = Object.values(obj)[0] || '';
            
            if(document.getElementById('modalTitle')) document.getElementById('modalTitle').textContent = 'Editar Registro';
            document.getElementById('modalForm').classList.remove('hidden');
        }));
    
    } catch(e) {}
}

document.getElementById('addBtn').addEventListener('click', () => { document.getElementById('modalForm').classList.remove('hidden'); document.getElementById('dataForm').reset(); currentEditId = null; document.getElementById('modalTitle') ? document.getElementById('modalTitle').textContent = 'Adicionar Novo' : null; });
document.getElementById('closeBtn').addEventListener('click', () => { document.getElementById('modalForm').classList.add('hidden'); currentEditId = null; });

document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const sb = document.getElementById('saveBtn'); sb.disabled = true;
    try {
        if (currentEditId) {
            const collectionName = (typeof colRef !== 'undefined') ? colRef.path : currentCollection;
            const docRef = doc(db, collectionName, currentEditId);
            await updateDoc(docRef, { campo1: document.getElementById('campo1').value, campo2: document.getElementById('campo2').value, createdAt: new Date().toISOString() });
        } else {
            await addDoc(colRef, { campo1: document.getElementById('campo1').value, campo2: document.getElementById('campo2').value, createdAt: new Date().toISOString() });
        }
        document.getElementById('modalForm').classList.add('hidden'); currentEditId = null; loadData();
    } catch(err){} finally { sb.disabled = false; }
});