function camelToSnakeKey(key) {
  return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}

function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// Converte uma linha do Postgres (snake_case) para o formato usado pelo componente
// React (camelCase). Não desce dentro de colunas jsonb — os objetos aninhados
// (checklist, comentários, prospects, transações...) já são gravados em camelCase.
export function rowToItem(row) {
  const item = {};
  for (const [key, value] of Object.entries(row)) {
    item[snakeToCamelKey(key)] = value;
  }
  return item;
}

export function itemToRow(item) {
  const row = {};
  for (const [key, value] of Object.entries(item)) {
    row[camelToSnakeKey(key)] = value;
  }
  return row;
}
