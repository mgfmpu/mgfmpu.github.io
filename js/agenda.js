import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const colRef = collection(db, "agenda"); 
let currentEditId = null;

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
                    <button class="btn-icon edit-btn" title="Editar" data-id="${d.id}" data-obj='${JSON.stringify(f).replace(/'/g, "&apos;")}'><i class="fas fa-edit"></i></button><button class="btn-icon del-btn" title="Excluir" data-id="${d.id}"><i class="fas fa-trash-alt"></i></button>
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
