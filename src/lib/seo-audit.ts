/**
 * Dev-only проверка иерархии заголовков (один h1, без пропуска уровней).
 */

export function auditHeadings(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const h1 = document.querySelectorAll("h1");
  if (h1.length === 0) {
    console.warn("SEO audit: на странице нет H1");
  }
  if (h1.length > 1) {
    console.warn(`SEO audit: несколько H1 (${h1.length})`);
  }
  let prevLevel = 0;
  headings.forEach((el) => {
    const level = parseInt(el.tagName[1], 10);
    if (prevLevel > 0 && level > prevLevel + 1) {
      console.warn(`SEO audit: пропуск уровня h${prevLevel} → h${level}`, el);
    }
    prevLevel = level;
  });
}
