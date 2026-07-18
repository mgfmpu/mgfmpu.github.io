import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

const dashboardContent = document.getElementById('dashboardContent');
const tableBody = document.getElementById('tableBody');
const modalForm = document.getElementById('modalForm');
const dataForm = document.getElementById('dataForm');
const tabelaSelect = document.getElementById('tabelaSelect');
let currentCollection = tabelaSelect.value; 
let currentEditId = null;

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
                    <button class="btn-icon edit-btn" title="Editar" data-id="${d.id}" data-obj='${JSON.stringify(f).replace(/'/g, "&apos;")}'><i class="fas fa-edit"></i></button><button class="btn-icon del-btn" title="Excluir" data-id="${d.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        document.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', async (e) => {
            if(confirm('Tem certeza que deseja excluir?')){ await deleteDoc(doc(db, currentCollection, e.target.getAttribute('data-id'))); loadData(); }
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
            if (f.nome !== undefined && document.getElementById('nome')) document.getElementById('nome').value = f.nome;
            if (f.cargo !== undefined && document.getElementById('cargo')) document.getElementById('cargo').value = f.cargo;
            if (f.telefone !== undefined && document.getElementById('telefone')) document.getElementById('telefone').value = f.telefone;
            if (f.endereco !== undefined && document.getElementById('endereco')) document.getElementById('endereco').value = f.endereco;
            
            // For generic generated pages:
            if (document.getElementById('campo1')) document.getElementById('campo1').value = Object.values(obj)[0] || '';
            if (document.getElementById('campo2')) document.getElementById('campo2').value = Object.values(obj)[1] || '';
            if (document.getElementById('valorInput')) document.getElementById('valorInput').value = Object.values(obj)[0] || '';
            
            if(document.getElementById('modalTitle')) document.getElementById('modalTitle').textContent = 'Editar Registro';
            document.getElementById('modalForm').classList.remove('hidden');
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
