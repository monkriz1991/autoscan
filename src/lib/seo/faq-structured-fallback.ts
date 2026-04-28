import { getTranslations } from "next-intl/server";
import type { StructuredDataDoc } from "@/lib/seo/structured-data";

const FAQ_MSG_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

/**
 * Статический FAQPage JSON-LD из `messages` `landing.faq` (должен совпадать с подсказками на лендинге).
 * Используется, если API не вернул валидный `mainEntity` (пустая БД, сбой сети).
 */
export async function buildFaqStructuredDataFromMessages(
  locale: string,
  pageUrl: string,
): Promise<StructuredDataDoc> {
  const t = await getTranslations({ locale, namespace: "landing" });
  const url = pageUrl.replace(/\/$/, "");
  const mainEntity: Record<string, unknown>[] = [];
  for (const key of FAQ_MSG_KEYS) {
    const name = t(`faq.${key}.q` as never);
    const text = t(`faq.${key}.a` as never);
    if (name && text) {
      mainEntity.push({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      });
    }
  }
  if (mainEntity.length === 0) {
    const tSeo = await getTranslations({ locale, namespace: "seo" });
    mainEntity.push({
      "@type": "Question",
      name: tSeo("faqTitle"),
      acceptedAnswer: { "@type": "Answer", text: tSeo("faqDescription") },
    });
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
