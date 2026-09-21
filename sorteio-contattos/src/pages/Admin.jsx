import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { formatCurrencyBRL, formatDateTimeBR } from '../lib/format.js';

const page = {
  minHeight: '100vh',
  background: '#F7F4EE',
  fontFamily: "'Inter', sans-serif",
  color: '#1A1614',
};

function LoginForm() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (err) {
      setErro('E-mail ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 28px',
          width: '100%',
          maxWidth: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: '#141414' }}>
          Painel do Sorteio
        </div>
        <div style={{ fontSize: 13, color: '#8a8480', marginTop: -8, marginBottom: 6 }}>
          Faça login para ver os cadastros.
        </div>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #ddd6cc', fontSize: 15 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          style={{ padding: '12px 14px', borderRadius: 8, border: '1.5px solid #ddd6cc', fontSize: 15 }}
        />
        {erro && (
          <div style={{ color: '#B3261E', fontSize: 13, background: '#FBEAE9', borderRadius: 8, padding: '10px 12px' }}>
            {erro}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#D32027',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: 14,
            fontFamily: "'Anton', sans-serif",
            fontSize: 15,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'ENTRANDO...' : 'ENTRAR'}
        </button>
      </form>
    </div>
  );
}

const STATUS_LABEL = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  desclassificado: 'Desclassificado',
};

const STATUS_COLOR = {
  pendente: { bg: '#FFF6E6', fg: '#7a5b12' },
  aprovado: { bg: '#E7F6EA', fg: '#1E7B34' },
  desclassificado: { bg: '#FBEAE9', fg: '#B3261E' },
};

function Dashboard({ user }) {
  const [inscricoes, setInscricoes] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [vencedor, setVencedor] = useState(null);
  const [fotoAberta, setFotoAberta] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'inscricoes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setInscricoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error(err);
        setPermissionError(true);
      }
    );
    return unsubscribe;
  }, []);

  const filtradas = useMemo(() => {
    if (!inscricoes) return [];
    const termo = busca.trim().toLowerCase();
    return inscricoes.filter((i) => {
      const bateStatus = filtroStatus === 'todos' || i.status === filtroStatus;
      const bateBusca =
        !termo ||
        i.nome?.toLowerCase().includes(termo) ||
        i.email?.toLowerCase().includes(termo) ||
        i.cpf?.toLowerCase().includes(termo) ||
        i.celular?.toLowerCase().includes(termo) ||
        i.numeros?.some((n) => n.includes(termo));
      return bateStatus && bateBusca;
    });
  }, [inscricoes, busca, filtroStatus]);

  const totalNumeros = useMemo(
    () => (inscricoes || []).reduce((acc, i) => acc + (i.numeros?.length || 0), 0),
    [inscricoes]
  );

  async function alterarStatus(id, status) {
    try {
      await updateDoc(doc(db, 'inscricoes', id), { status });
    } catch (err) {
      console.error(err);
      alert('Não foi possível atualizar o status. Você tem permissão de admin?');
    }
  }

  function sortearVencedor() {
    const aprovados = (inscricoes || []).filter((i) => i.status !== 'desclassificado');
    const todosNumeros = aprovados.flatMap((i) => i.numeros.map((num) => ({ num, inscricao: i })));
    if (todosNumeros.length === 0) return;
    const sorteado = todosNumeros[Math.floor(Math.random() * todosNumeros.length)];
    setVencedor(sorteado);
  }

  function exportarCsv() {
    const linhas = [
      ['Nome', 'Celular', 'CPF', 'E-mail', 'Valor', 'Números', 'Status', 'Data'],
      ...(inscricoes || []).map((i) => [
        i.nome,
        i.celular,
        i.cpf,
        i.email,
        i.valor,
        (i.numeros || []).join(' '),
        STATUS_LABEL[i.status] || i.status,
        i.createdAt?.toDate ? formatDateTimeBR(i.createdAt.toDate()) : '',
      ]),
    ];
    const csv = linhas.map((l) => l.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorteio-contattos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (permissionError) {
    return (
      <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
        <div>
          <p style={{ maxWidth: 360 }}>
            Sua conta ({user.email}) não tem permissão de administrador. Peça para adicionar seu UID
            (<code>{user.uid}</code>) na coleção <code>admins</code> do Firestore.
          </p>
          <button onClick={() => signOut(auth)} style={{ marginTop: 12, padding: '10px 18px', borderRadius: 8, border: '1.5px solid #D32027', background: 'transparent', color: '#D32027', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...page, padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 26, color: '#141414' }}>
              Cadastros do Sorteio
            </div>
            <div style={{ fontSize: 13, color: '#8a8480' }}>
              {inscricoes ? `${inscricoes.length} cadastro(s) · ${totalNumeros} número(s) emitido(s)` : 'Carregando...'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={exportarCsv} style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #141414', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Exportar CSV
            </button>
            <button onClick={sortearVencedor} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#F5821F', color: '#141414', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              🎱 Sortear vencedor
            </button>
            <button onClick={() => signOut(auth)} style={{ padding: '10px 16px', borderRadius: 8, border: '1.5px solid #D32027', background: 'transparent', color: '#D32027', cursor: 'pointer', fontSize: 13 }}>
              Sair
            </button>
          </div>
        </div>

        {vencedor && (
          <div style={{ background: '#141414', color: '#fff', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ color: '#F6B23F', fontFamily: "'Anton', sans-serif", fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>
              NÚMERO SORTEADO: {vencedor.num}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{vencedor.inscricao.nome}</div>
            <div style={{ fontSize: 13, color: '#d8d3cc' }}>
              {vencedor.inscricao.email} · {vencedor.inscricao.celular} · {vencedor.inscricao.cpf}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, CPF, celular ou número..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #ddd6cc', fontSize: 14 }}
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #ddd6cc', fontSize: 14 }}
          >
            <option value="todos">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="aprovado">Aprovado</option>
            <option value="desclassificado">Desclassificado</option>
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#faf8f4', color: '#6a645e' }}>
                {['Nome', 'Contato', 'CPF', 'Valor', 'Números', 'Nota fiscal', 'Status', 'Data'].map((h) => (
                  <th key={h} style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((i) => {
                const cor = STATUS_COLOR[i.status] || STATUS_COLOR.pendente;
                return (
                  <tr key={i.id} style={{ borderTop: '1px solid #eee8de' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{i.nome}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div>{i.email}</div>
                      <div style={{ color: '#8a8480' }}>{i.celular}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>{i.cpf}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{formatCurrencyBRL(i.valor)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 160 }}>
                        {(i.numeros || []).map((n) => (
                          <span key={n} style={{ background: '#FFF0DC', color: '#7a4a12', borderRadius: 4, padding: '2px 6px', fontSize: 12 }}>{n}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {i.notaFiscalFoto ? (
                        <img
                          src={i.notaFiscalFoto}
                          alt="Nota fiscal"
                          onClick={() => setFotoAberta(i.notaFiscalFoto)}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid #eee8de' }}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={i.status}
                        onChange={(e) => alterarStatus(i.id, e.target.value)}
                        style={{
                          background: cor.bg,
                          color: cor.fg,
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 8px',
                          fontWeight: 600,
                          fontSize: 12.5,
                        }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="desclassificado">Desclassificado</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#8a8480' }}>
                      {i.createdAt?.toDate ? formatDateTimeBR(i.createdAt.toDate()) : '—'}
                    </td>
                  </tr>
                );
              })}
              {inscricoes && filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#8a8480' }}>
                    Nenhum cadastro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {fotoAberta && (
        <div
          onClick={() => setFotoAberta(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20,20,20,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
            cursor: 'zoom-out',
          }}
        >
          <img src={fotoAberta} alt="Nota fiscal" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return null;
  if (!user) return <LoginForm />;
  return <Dashboard user={user} />;
}
