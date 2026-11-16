// Mostrado na hora do clique enquanto a próxima página carrega
export default function PageLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando">
      <div>
        <div className="h-8 w-64 rounded-xl bg-line" />
        <div className="mt-2 h-4 w-80 max-w-full rounded-lg bg-line/70" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-white shadow-soft" />)}
      </div>
      <div className="h-72 rounded-2xl bg-white shadow-soft" />
    </div>
  );
}
