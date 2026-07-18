import { auth, authorizedEmails, app } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, collection, writeBatch, doc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

const dashboardContent = document.getElementById('dashboardContent');
const fileInput = document.getElementById('jsonFileInput');
const analisarBtn = document.getElementById('analisarBtn');
const resultadoAnalise = document.getElementById('resultadoAnalise');
const tabelasList = document.getElementById('tabelasList');
const avisoVazio = document.getElementById('avisoVazio');
const migrarBtn = document.getElementById('migrarBtn');
const statusMigracao = document.getElementById('statusMigracao');

let dbExportData = null;

// Verifica autenticação
onAuthStateChanged(auth, (user) => {
    if (user && authorizedEmails.includes(user.email)) {
        dashboardContent.classList.remove('hidden');
    } else {
        window.location.href = 'index.html';
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        analisarBtn.disabled = false;
    }
});

analisarBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            dbExportData = json.filter(item => item.type === 'table');
            
            tabelasList.innerHTML = '';
            let hasMembros = false;

            dbExportData.forEach(tabela => {
                const li = document.createElement('li');
                li.textContent = `${tabela.name}: ${tabela.data.length} registros`;
                tabelasList.appendChild(li);
                
                if (tabela.name === 'membro' && tabela.data.length > 0) hasMembros = true;
            });

            if (!hasMembros) {
                avisoVazio.style.display = 'block';
            } else {
                avisoVazio.style.display = 'none';
            }

            resultadoAnalise.classList.remove('hidden');
        } catch (err) {
            alert('Erro ao ler o arquivo JSON. Certifique-se de que é um export válido do phpMyAdmin.');
            console.error(err);
        }
    };
    reader.readAsText(file);
});

migrarBtn.addEventListener('click', async () => {
    if (!dbExportData) return;
    
    migrarBtn.disabled = true;
    statusMigracao.textContent = 'Iniciando migração... Por favor, não feche a página.';

    try {
        for (const tabela of dbExportData) {
            if (tabela.data.length === 0) continue;
            
            statusMigracao.textContent = `Migrando tabela '${tabela.name}'...`;
            
            // O Firestore Batch suporta até 500 operações.
            // Para tabelas maiores que 500, precisaria dividir em chunks.
            // Este script faz em chunks de 400.
            const chunks = [];
            for (let i = 0; i < tabela.data.length; i += 400) {
                chunks.push(tabela.data.slice(i, i + 400));
            }

            for (let c = 0; c < chunks.length; c++) {
                const batch = writeBatch(db);
                const colRef = collection(db, tabela.name);
                
                chunks[c].forEach(row => {
                    // Adiciona um mapeamento padronizado para a tabela de membro (se for ela)
                    let docData = { ...row };
                    if (tabela.name === 'membro') {
                        docData = {
                            nome: row.Nome || '',
                            cpf: row.CPF || '',
                            dataNasc: row.DataNasc || '',
                            sexo: row.Sexo || 'M',
                            telefone: row.Celular_1 || row.TelefoneRes || '',
                            cargo: row.CargoMinisterial || 'Membro',
                            legacyId: row.Id_membro,
                            _rawData: row
                        };
                    }
                    
                    const newDocRef = doc(colRef);
                    batch.set(newDocRef, docData);
                });
                
                await batch.commit();
            }
        }
        
        statusMigracao.textContent = 'Migração concluída com sucesso! Todos os dados foram enviados para o Firestore.';
        statusMigracao.style.color = 'var(--success-color)';
    } catch (err) {
        console.error(err);
        statusMigracao.textContent = 'Erro durante a migração: ' + err.message;
        statusMigracao.style.color = 'var(--error-color)';
    } finally {
        migrarBtn.disabled = false;
    }
});
