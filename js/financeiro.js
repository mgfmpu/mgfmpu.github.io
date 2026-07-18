import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);
const financeiroRef = collection(db, "financeiro");

// Elementos
const dashboardContent = document.getElementById('dashboardContent');
const finTableBody = document.getElementById('finTableBody');
const finModal = document.getElementById('finModal');
const finForm = document.getElementById('finForm');
const addFinBtn = document.getElementById('addFinBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTitle = document.getElementById('modalTitle');

const totalReceitasEl = document.getElementById('totalReceitas');
const totalDespesasEl = document.getElementById('totalDespesas');
const saldoAtualEl = document.getElementById('saldoAtual');

// Autenticação
onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        dashboardContent.classList.remove('hidden');
        loadFinanceiro();
    } else {
        window.location.href = 'index.html';
    }
});

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Carregar Dados
async function loadFinanceiro() {
    finTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    try {
        const snapshot = await getDocs(financeiroRef);
        finTableBody.innerHTML = '';
        
        if (snapshot.empty) {
            finTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum lançamento encontrado.</td></tr>';
            return;
        }

        let totalReceita = 0;
        let totalDespesa = 0;
        
        let docs = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            docs.push(data);
        });

        // Ordenar por data mais recente
        docs.sort((a, b) => {
            const dateA = a.Dt_Lancamento || a.dataLancamento || '';
            const dateB = b.Dt_Lancamento || b.dataLancamento || '';
            return dateB.localeCompare(dateA);
        });

        docs.forEach((f) => {
            // Normalização: Lidando com os dados recém-migrados (SQL) x novos registros
            let valor = 0;
            let tipo = 'receita';
            
            // Dados novos terão f.tipo e f.valor
            if (f.valor !== undefined) {
                valor = parseFloat(f.valor);
                tipo = f.tipo;
            } else {
                // Dados antigos (migração)
                if (f.Receitas && parseFloat(f.Receitas) > 0) {
                    valor = parseFloat(f.Receitas);
                    tipo = 'receita';
                } else if (f.Despesas && parseFloat(f.Despesas) > 0) {
                    valor = parseFloat(f.Despesas);
                    tipo = 'despesa';
                }
            }

            if (tipo === 'receita') {
                totalReceita += valor;
            } else {
                totalDespesa += valor;
            }

            const dataFormatada = f.Dt_Lancamento || f.dataLancamento || '-';
            const descricao = f.Descricao || f.descricao || '-';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dataFormatada}</td>
                <td><strong>${descricao}</strong></td>
                <td><span class="${tipo === 'receita' ? 'badge-receita' : 'badge-despesa'}">${tipo === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                <td style="font-weight: 600; color: ${tipo === 'receita' ? '#10b981' : '#ef4444'}">${formatarMoeda(valor)}</td>
                <td class="action-btns">
                    <button class="btn btn-outline del-btn" style="color: var(--error-color); border-color: var(--error-color);" data-id="${f.id}">Excluir</button>
                </td>
            `;
            finTableBody.appendChild(tr);
        });

        // Atualizar Cards
        totalReceitasEl.textContent = formatarMoeda(totalReceita);
        totalDespesasEl.textContent = formatarMoeda(totalDespesa);
        const saldo = totalReceita - totalDespesa;
        saldoAtualEl.textContent = formatarMoeda(saldo);
        saldoAtualEl.style.color = saldo >= 0 ? '#3b82f6' : '#ef4444';

        // Listeners de Excluir
        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Tem certeza que deseja excluir este lançamento?')) {
                    const id = e.target.getAttribute('data-id');
                    await deleteDoc(doc(db, "financeiro", id));
                    loadFinanceiro();
                }
            });
        });

    } catch (e) {
        console.error("Erro ao carregar financeiro: ", e);
        finTableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:var(--error-color)">Erro ao carregar lançamentos.</td></tr>';
    }
}

// Modal
function openModal() {
    finModal.classList.remove('hidden');
    finForm.reset();
    document.getElementById('finId').value = '';
    document.getElementById('dataLancamento').value = new Date().toISOString().split('T')[0];
}

addFinBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', () => finModal.classList.add('hidden'));

// Salvar
finForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.textContent = 'Salvando...';
    saveBtn.disabled = true;

    const dataObj = {
        descricao: document.getElementById('descricao').value,
        tipo: document.getElementById('tipo').value,
        valor: parseFloat(document.getElementById('valor').value),
        dataLancamento: document.getElementById('dataLancamento').value,
        situacao: document.getElementById('situacao').value,
        updatedAt: new Date().toISOString()
    };

    try {
        dataObj.createdAt = new Date().toISOString();
        await addDoc(financeiroRef, dataObj);
        finModal.classList.add('hidden');
        loadFinanceiro();
    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert('Erro ao salvar lançamento financeiro.');
    } finally {
        saveBtn.textContent = 'Salvar';
        saveBtn.disabled = false;
    }
});
