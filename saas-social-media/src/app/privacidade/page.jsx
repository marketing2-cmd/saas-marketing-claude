export const metadata = { title: "Política de Privacidade · SaaS Social Media" };

// Página exigida pela Meta na revisão do app. Revise o texto com seu jurídico.
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed text-ink-soft">
      <h1 className="mb-6 text-2xl font-bold text-ink">Política de Privacidade</h1>
      <p>O SaaS Social Media ajuda social medias e agências a planejar, aprovar e publicar conteúdo nas redes sociais dos seus clientes.</p>
      <h2 className="mb-2 mt-6 font-bold text-ink">Dados que coletamos</h2>
      <p>E-mail e nome de quem cria a conta; dados dos clientes cadastrados; textos, imagens e vídeos enviados para os posts; e, quando você conecta uma conta do Instagram, o identificador da conta, o nome de usuário e um token de acesso concedido pela Meta.</p>
      <h2 className="mb-2 mt-6 font-bold text-ink">Como usamos</h2>
      <p>O token da Meta é usado exclusivamente para publicar os posts que você ou seu cliente aprovaram, na data agendada. Não vendemos nem compartilhamos seus dados com terceiros.</p>
      <h2 className="mb-2 mt-6 font-bold text-ink">Exclusão de dados</h2>
      <p>Você pode desconectar o Instagram a qualquer momento na página do cliente, o que apaga o token. Para excluir sua conta e todos os dados, entre em contato pelo e-mail de suporte informado no site.</p>
    </main>
  );
}
