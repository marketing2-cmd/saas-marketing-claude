import { useEffect, useRef, useState } from 'react';
import { maskCelular, maskCpf, formatCurrencyBRL } from '../lib/format.js';
import { criarInscricao } from '../lib/inscricoes.js';

const DATA_SORTEIO = new Date('2026-12-01T00:00:00-03:00');
const VALOR_MINIMO = 250;

function pad(n) {
  return String(Math.max(0, n)).padStart(2, '0');
}

function useCountdown(target) {
  const [countdown, setCountdown] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, target.getTime() - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return countdown;
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(30px)',
    transition: 'opacity 0.7s ease, transform 0.7s ease',
  };

  return [ref, style];
}

const inputStyle = {
  padding: '12px 14px',
  borderRadius: 8,
  border: '1.5px solid #ddd6cc',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: "'Inter', sans-serif",
  width: '100%',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: '#3a342f',
};

const initialForm = { nome: '', celular: '', cpf: '', email: '', valor: '' };

export default function Sorteio() {
  const countdown = useCountdown(DATA_SORTEIO);
  const [howItWorksRef, howItWorksStyle] = useReveal();
  const [prizeRef, prizeStyle] = useReveal();
  const [formRef, formStyle] = useReveal();

  const [form, setForm] = useState(initialForm);
  const [notaFiscalFile, setNotaFiscalFile] = useState(null);
  const [notaFiscalPreview, setNotaFiscalPreview] = useState(null);
  const [aceite, setAceite] = useState(false);
  const [showRegulamento, setShowRegulamento] = useState(false);
  const [showValorError, setShowValorError] = useState(false);
  const [showAceiteError, setShowAceiteError] = useState(false);
  const [showNotaError, setShowNotaError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [resultado, setResultado] = useState(null);

  const valorNum = parseFloat(String(form.valor).replace(',', '.')) || 0;
  const ticketsPreview = valorNum >= VALOR_MINIMO ? Math.floor(valorNum / VALOR_MINIMO) : 0;

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function onNotaFiscalChange(e) {
    const file = e.target.files?.[0] || null;
    setNotaFiscalFile(file);
    setShowNotaError(false);
    if (file) setNotaFiscalPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    let valid = true;
    if (!valorNum || valorNum < VALOR_MINIMO) {
      setShowValorError(true);
      valid = false;
    }
    if (!notaFiscalFile) {
      setShowNotaError(true);
      valid = false;
    }
    if (!aceite) {
      setShowAceiteError(true);
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    try {
      const { numeros } = await criarInscricao({
        nome: form.nome,
        celular: form.celular,
        cpf: form.cpf,
        email: form.email,
        valor: form.valor,
        notaFiscalFile,
      });
      setResultado({ ...form, numeros, valorFormatado: formatCurrencyBRL(valorNum) });
    } catch (err) {
      console.error(err);
      setSubmitError(
        err?.message?.includes('grande demais')
          ? err.message
          : 'Não conseguimos concluir seu cadastro agora. Tente novamente em instantes.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setNotaFiscalFile(null);
    setNotaFiscalPreview(null);
    setAceite(false);
    setShowValorError(false);
    setShowAceiteError(false);
    setShowNotaError(false);
    setSubmitError('');
    setResultado(null);
  }

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        color: '#1A1614',
        backgroundColor: '#F7F4EE',
        backgroundImage: 'radial-gradient(rgba(20,20,20,0.05) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* HERO */}
      <section
        style={{
          position: 'relative',
          padding: '64px 20px 68px',
          overflow: 'hidden',
          textAlign: 'center',
          backgroundImage:
            'radial-gradient(circle at 50% 0%, #231f1c 0%, #141414 60%), radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: 'auto, 16px 16px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            left: -60,
            width: 220,
            height: 400,
            background: 'linear-gradient(135deg, #F5821F, #D32027)',
            clipPath: 'polygon(30% 0%, 70% 0%, 50% 100%, 10% 100%)',
            opacity: 0.9,
            animation: 'stripeDrift 7s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            right: -50,
            width: 200,
            height: 380,
            background: 'linear-gradient(135deg, #F6B23F, #F5821F)',
            clipPath: 'polygon(30% 0%, 70% 0%, 50% 100%, 10% 100%)',
            opacity: 0.85,
            animation: 'stripeDrift 8s ease-in-out infinite reverse',
          }}
        />
        <div style={{ position: 'absolute', top: 18, right: 26, fontSize: 34, color: '#F6B23F', animation: 'floatSlow 5s ease-in-out infinite' }}>⚡</div>
        <div style={{ position: 'absolute', bottom: 30, left: 22, fontSize: 26, color: '#D32027', animation: 'floatSlow 6s ease-in-out infinite reverse' }}>⚡</div>

        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ position: 'relative', width: 260, margin: '0 auto' }}>
            <div
              style={{
                position: 'absolute',
                inset: -30,
                background: 'radial-gradient(circle, rgba(246,178,63,0.45) 0%, rgba(246,178,63,0) 70%)',
                animation: 'glowBreathe 3.4s ease-in-out infinite',
              }}
            />
            <img
              src="/assets/badge-18-anos.png"
              alt="18 anos Contattos+"
              style={{
                position: 'relative',
                width: '100%',
                display: 'block',
                margin: '0 auto',
                filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.45))',
                animation: 'badgePop 0.6s ease-out both',
              }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(246,178,63,0.14)',
              border: '1px solid rgba(246,178,63,0.4)',
              color: '#F6B23F',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              padding: '6px 14px',
              borderRadius: 999,
              margin: '18px 0 0',
            }}
          >
            SORTEIO OFICIAL · 18 ANOS CONTATTOS+
          </div>

          <h1
            style={{
              fontFamily: "'Anton', sans-serif",
              color: '#fff',
              fontSize: 'clamp(32px, 7vw, 54px)',
              lineHeight: 1.08,
              margin: '16px 0 10px',
              textShadow: '0 4px 18px rgba(0,0,0,0.35)',
              animation: 'heroFadeUp 0.7s ease-out 0.15s both',
            }}
          >
            CONCORRA A UMA <span style={{ color: '#F5821F' }}>MESA DE SINUCA</span>{' '}
            <span style={{ color: '#F6B23F' }}>PREMIUM</span>
          </h1>

          <p style={{ color: '#d8d3cc', fontSize: 16, margin: '0 0 26px', animation: 'heroFadeUp 0.7s ease-out 0.3s both' }}>
            Celebre nosso aniversário com a gente. A cada R$ 250,00 em compras, você ganha um número da sorte.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28, animation: 'heroFadeUp 0.7s ease-out 0.42s both' }}>
            {[
              ['d', 'DIAS'],
              ['h', 'HORAS'],
              ['m', 'MIN'],
              ['s', 'SEG'],
            ].map(([key, label]) => (
              <div key={key} style={{ background: '#1e1a17', border: '1px solid #322c27', borderRadius: 10, padding: '10px 14px', minWidth: 58 }}>
                <div style={{ fontFamily: "'Anton', sans-serif", color: '#F6B23F', fontSize: 22 }}>{countdown[key]}</div>
                <div style={{ fontSize: 10, color: '#a89f96', letterSpacing: 0.5 }}>{label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToForm}
            className="cta-button"
            style={{
              background: '#D32027',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '16px 32px',
              fontFamily: "'Anton', sans-serif",
              fontSize: 16,
              letterSpacing: 0.5,
              cursor: 'pointer',
              animation: 'heroFadeUp 0.7s ease-out 0.54s both, ctaPulse 2.4s ease-in-out 1.5s infinite',
            }}
          >
            QUERO PARTICIPAR →
          </button>
        </div>
      </section>

      {/* COMO PARTICIPAR */}
      <section ref={howItWorksRef} style={{ maxWidth: 680, margin: '0 auto', padding: '56px 22px 20px' }}>
        <div style={howItWorksStyle}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, color: '#F5821F', textAlign: 'center', letterSpacing: 1.5, marginBottom: 8 }}>
            SIMPLES ASSIM
          </div>
          <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 28, color: '#141414', textAlign: 'center', marginBottom: 30 }}>
            COMO PARTICIPAR
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
            {[
              { cor: '#F5821F', texto: <>Compre a partir de <strong>R$ 250,00</strong> em qualquer loja Contattos+.</> },
              { cor: '#D32027', texto: 'Cadastre seus dados e envie a foto da nota fiscal.' },
              { cor: '#F6B23F', texto: 'Receba 1 número da sorte a cada R$ 250,00. Quanto mais comprar, mais chances!' },
            ].map((item, i) => (
              <div
                key={i}
                className="step-card"
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '24px 20px',
                  boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
                  borderTop: `3px solid ${item.cor}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: '#141414',
                    color: '#F6B23F',
                    fontFamily: "'Anton', sans-serif",
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{item.texto}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRÊMIO */}
      <section ref={prizeRef} style={{ maxWidth: 680, margin: '0 auto', padding: '36px 22px' }}>
        <div
          style={{
            ...prizeStyle,
            position: 'relative',
            background: 'linear-gradient(180deg, #1a1613, #141414)',
            borderRadius: 20,
            padding: '36px 24px',
            textAlign: 'center',
            border: '1px solid #2a241f',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: '#D32027',
              color: '#fff',
              fontFamily: "'Anton', sans-serif",
              fontSize: 11,
              letterSpacing: 1,
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            OFICIAL
          </div>
          <div style={{ fontFamily: "'Anton', sans-serif", color: '#F6B23F', fontSize: 13, letterSpacing: 1.5, marginBottom: 14 }}>
            O PRÊMIO
          </div>
          <div
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              margin: '0 auto 18px',
              maxWidth: 420,
              border: '2px solid #F5821F',
              animation: 'glowPulse 3.2s ease-in-out infinite',
            }}
          >
            <img
              src="/assets/mesa-sinuca.webp"
              alt="Mesa de sinuca premium"
              style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ fontFamily: "'Anton', sans-serif", color: '#fff', fontSize: 24, marginBottom: 6 }}>
            MESA DE SINUCA PREMIUM
          </div>
          <div style={{ color: '#b8b0a8', fontSize: 14 }}>
            Sorteio em 01/12/2026 entre todos os números gerados na promoção.
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section ref={formRef} id="cadastro" style={{ maxWidth: 680, margin: '0 auto', padding: '20px 22px 40px' }}>
        <div style={formStyle}>
          {!resultado ? (
            <form
              onSubmit={handleSubmit}
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: '32px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                border: '1px solid #eee8de',
              }}
            >
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 13, color: '#F5821F', letterSpacing: 1.5 }}>
                ÚLTIMA ETAPA
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 26, color: '#141414', marginTop: -8 }}>
                GARANTA SEUS NÚMEROS DA SORTE
              </div>

              <label style={labelStyle}>
                Nome completo
                <input
                  type="text"
                  className="form-input"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Seu nome completo"
                  required
                  style={inputStyle}
                />
              </label>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
                  Celular
                  <input
                    type="tel"
                    className="form-input"
                    value={form.celular}
                    onChange={(e) => setForm((f) => ({ ...f, celular: maskCelular(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    required
                    style={inputStyle}
                  />
                </label>
                <label style={{ ...labelStyle, flex: 1, minWidth: 160 }}>
                  CPF
                  <input
                    type="text"
                    className="form-input"
                    value={form.cpf}
                    onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))}
                    placeholder="000.000.000-00"
                    required
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                E-mail
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="seuemail@exemplo.com"
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Valor da compra (R$)
                <input
                  type="number"
                  min="250"
                  step="0.01"
                  className="form-input"
                  value={form.valor}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, valor: e.target.value }));
                    setShowValorError(false);
                  }}
                  placeholder="Ex: 250,00"
                  required
                  style={inputStyle}
                />
                <span style={{ fontSize: 12, color: '#8a8480', fontWeight: 400 }}>
                  Valor mínimo de R$ 250,00. A cada R$ 250,00, +1 número da sorte.
                </span>
              </label>

              {ticketsPreview > 0 && (
                <div style={{ background: '#FFF6E6', border: '1px solid #F6B23F', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: '#7a5b12', fontWeight: 600 }}>
                  🎱 Você vai receber <strong>{ticketsPreview}</strong> número(s) da sorte!
                </div>
              )}

              <div style={labelStyle}>
                Foto da nota fiscal
                <label
                  htmlFor="nota-fiscal"
                  style={{
                    width: '100%',
                    height: 140,
                    borderRadius: 10,
                    border: '1.5px dashed #ddd6cc',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    color: '#8a8480',
                    fontSize: 13,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: notaFiscalPreview ? `center/cover no-repeat url(${notaFiscalPreview})` : '#faf8f4',
                  }}
                >
                  {!notaFiscalPreview && <span>📎 Toque para enviar a foto da nota fiscal</span>}
                  <input id="nota-fiscal" type="file" accept="image/*" onChange={onNotaFiscalChange} style={{ display: 'none' }} />
                </label>
                {notaFiscalFile && (
                  <span style={{ fontSize: 12, color: '#4a443f', fontWeight: 400 }}>{notaFiscalFile.name}</span>
                )}
              </div>

              {showValorError && (
                <div style={{ color: '#B3261E', fontSize: 13, background: '#FBEAE9', borderRadius: 8, padding: '10px 12px' }}>
                  O valor da compra deve ser de no mínimo R$ 250,00.
                </div>
              )}

              {showNotaError && (
                <div style={{ color: '#B3261E', fontSize: 13, background: '#FBEAE9', borderRadius: 8, padding: '10px 12px' }}>
                  Envie a foto da nota fiscal para continuar.
                </div>
              )}

              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#3a342f', lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={aceite}
                  onChange={(e) => {
                    setAceite(e.target.checked);
                    setShowAceiteError(false);
                  }}
                  style={{ marginTop: 3, width: 16, height: 16, accentColor: '#D32027' }}
                />
                <span>
                  Li e aceito o{' '}
                  <a href="#regulamento" onClick={(e) => { e.preventDefault(); setShowRegulamento((v) => !v); }}>
                    regulamento oficial do sorteio
                  </a>
                  . Estou de acordo que a nota fiscal enviada será confrontada com os dados informados e, em caso de
                  divergência, meu cadastro poderá ser desclassificado.
                </span>
              </label>

              {showAceiteError && (
                <div style={{ color: '#B3261E', fontSize: 13, background: '#FBEAE9', borderRadius: 8, padding: '10px 12px' }}>
                  É preciso aceitar o regulamento para continuar.
                </div>
              )}

              {submitError && (
                <div style={{ color: '#B3261E', fontSize: 13, background: '#FBEAE9', borderRadius: 8, padding: '10px 12px' }}>
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="cta-button"
                style={{
                  background: submitting ? '#e08a8d' : '#D32027',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: 16,
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 17,
                  letterSpacing: 0.5,
                  cursor: submitting ? 'default' : 'pointer',
                  marginTop: 4,
                  transition: 'background 0.2s, transform 0.15s',
                }}
              >
                {submitting ? 'ENVIANDO...' : 'QUERO PARTICIPAR'}
              </button>
            </form>
          ) : (
            <div
              style={{
                background: '#fff',
                borderRadius: 18,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                animation: 'popIn 0.5s ease-out both',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#F6B23F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 32,
                  color: '#141414',
                }}
              >
                ✓
              </div>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 24, color: '#141414' }}>
                CADASTRO CONFIRMADO!
              </div>
              <div style={{ fontSize: 14.5, color: '#4a443f', lineHeight: 1.5, maxWidth: 400 }}>
                Boa sorte, {resultado.nome}! Guarde seu(s) número(s) da sorte — o resultado do sorteio será divulgado
                em <strong>01/12/2026</strong>.
              </div>

              <div style={{ width: '100%', background: '#141414', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: '#F6B23F', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                  SEUS NÚMEROS DA SORTE
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {resultado.numeros.map((num) => (
                    <div
                      key={num}
                      style={{
                        background: '#F5821F',
                        color: '#141414',
                        fontFamily: "'Anton', sans-serif",
                        fontSize: 20,
                        padding: '10px 16px',
                        borderRadius: 8,
                        letterSpacing: 1,
                        animation: 'popIn 0.4s ease-out both',
                      }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ width: '100%', background: '#F7F4EE', borderRadius: 12, padding: '16px 18px', textAlign: 'left', fontSize: 13.5, color: '#3a342f', lineHeight: 1.7 }}>
                <div><strong>Nome:</strong> {resultado.nome}</div>
                <div><strong>E-mail:</strong> {resultado.email}</div>
                <div><strong>Celular:</strong> {resultado.celular}</div>
                <div><strong>Valor da compra:</strong> {resultado.valorFormatado}</div>
              </div>

              <button
                onClick={resetForm}
                style={{
                  background: 'transparent',
                  color: '#D32027',
                  border: '1.5px solid #D32027',
                  borderRadius: 10,
                  padding: '12px 20px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                Fazer novo cadastro
              </button>
            </div>
          )}

          {showRegulamento && (
            <div id="regulamento" style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: '18px 20px', fontSize: 13, lineHeight: 1.7, color: '#4a443f', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 15, color: '#141414', marginBottom: 8 }}>
                REGULAMENTO RESUMIDO
              </div>
              <div>• Promoção válida de 01/10/2026 a 30/11/2026, em compras a partir de R$ 250,00.</div>
              <div>• A cada R$ 250,00 em compras, o cliente recebe 1 número da sorte.</div>
              <div>• O cadastro exige nome, celular, CPF, e-mail, valor da compra e foto legível da nota fiscal.</div>
              <div>• A nota fiscal enviada será confrontada com os dados informados. Em caso de divergência ou fraude, o cadastro será desclassificado.</div>
              <div>• Sorteio realizado em 01/12/2026. Prêmio: 1 Mesa de Sinuca Premium.</div>
            </div>
          )}
        </div>
      </section>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '8px 22px 4px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#9a9490', letterSpacing: 1, marginBottom: 14 }}>COM O APOIO DE</div>
        <img
          src="/assets/parceiros.png"
          alt="Parceiros: MarGirius, Foxlux, Soprano, Tramontina, Blumenau Iluminação, Wago, Lorenzetti, WEG"
          style={{ width: '100%', maxWidth: 460 }}
        />
      </div>

      <div style={{ padding: '18px 22px 36px', textAlign: 'center', fontSize: 11.5, color: '#9a9490' }}>
        Promoção 18 anos Contattos+ · Sorteio de 01/10 a 30/11/2026
      </div>
    </div>
  );
}
