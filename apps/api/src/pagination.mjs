/** Página solicitada sempre corresponde a uma página existente (ou 1 em listas vazias). */
export function clampPage(page, limit, total) {
  const pages = Math.ceil(total / limit);
  return Math.min(Math.max(1, page), Math.max(1, pages));
}
