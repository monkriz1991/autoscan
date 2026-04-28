/**
 * FAQPage JSON-LD из публичного списка FAQ — совпадает с тем, что видит пользователь на /faq.
 */
import type { FaqPublicItem } from "@/lib/api";
import type { StructuredDataDoc } from "@/lib/seo/structured-data";

const ANSWER_MAX_LEN = 8000;

/** Текст ответа для schema.org (как strip_tags в Django faq_page_schema). */
function plainTextFromAnswerHtml(html: string): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= ANSWER_MAX_LEN) return text;
  return `${text.slice(0, ANSWER_MAX_LEN - 3)}...`;
}

/**
 * FAQPage из того же списка, что рендерится на /faq (совпадение с видимым контентом).
 * Пустой список — без узла FAQPage (пустой @graph этой части).
 */
export function buildFaqStructuredDataFromPublicItems(
  items: FaqPublicItem[],
  pageUrl: string,
): StructuredDataDoc {
  const url = pageUrl.replace(/\/$/, "");
  const mainEntity: Record<string, unknown>[] = [];
  for (const item of items) {
    const name = (item.question || "").trim();
    const textAnswer = plainTextFromAnswerHtml(item.answer_html || "");
    if (!name && !textAnswer) continue;
    const q = name || item.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    mainEntity.push({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: textAnswer || q,
      },
    });
  }
  if (mainEntity.length === 0) {
    return { "@context": "https://schema.org", "@graph": [] };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${url}#faqpage`,
        url,
        mainEntity,
      },
    ],
  };
}
