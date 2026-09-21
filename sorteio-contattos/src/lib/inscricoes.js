import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.js';

const VALOR_POR_NUMERO = 250;
const PRIMEIRO_NUMERO = 1000;

// Aloca um bloco de números sequenciais e únicos usando uma transação no
// contador counters/sorteio. Evita números repetidos mesmo com muita gente
// se cadastrando ao mesmo tempo, sem precisar de um servidor próprio.
async function alocarNumeros(quantidade) {
  const counterRef = doc(db, 'counters', 'sorteio');

  const ultimoNumero = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(counterRef);
    const atual = snap.exists() ? snap.data().lastNumber : PRIMEIRO_NUMERO;
    const novo = atual + quantidade;
    transaction.update(counterRef, { lastNumber: novo });
    return atual;
  });

  return Array.from({ length: quantidade }, (_, i) => String(ultimoNumero + i + 1));
}

async function enviarNotaFiscal(arquivo) {
  const nomeArquivo = `${Date.now()}-${crypto.randomUUID()}-${arquivo.name}`;
  const storageRef = ref(storage, `notas-fiscais/${nomeArquivo}`);
  await uploadBytes(storageRef, arquivo, { contentType: arquivo.type });
  return getDownloadURL(storageRef);
}

export async function criarInscricao({ nome, celular, cpf, email, valor, notaFiscalFile }) {
  const valorNum = parseFloat(String(valor).replace(',', '.'));
  const quantidadeNumeros = Math.floor(valorNum / VALOR_POR_NUMERO);

  const notaFiscalUrl = await enviarNotaFiscal(notaFiscalFile);
  const numeros = await alocarNumeros(quantidadeNumeros);

  await addDoc(collection(db, 'inscricoes'), {
    nome,
    celular,
    cpf,
    email,
    valor: valorNum,
    numeros,
    notaFiscalUrl,
    status: 'pendente',
    createdAt: serverTimestamp(),
  });

  return { numeros, valorNum };
}
