/**
 * Убирает из пользовательского HTML теги, которые должны существовать только в <head>.
 * Это предотвращает ложные SEO-ошибки вида "canonical outside of head".
 */
export function stripHeadOnlyTagsFromHtml(html: string): string {
  if (!html) {
    return html;
  }

  return html
    .replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/gi, "")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
}
