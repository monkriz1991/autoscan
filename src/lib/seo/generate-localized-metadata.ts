import type { Metadata } from "next";
import type { AppLocale } from "@/lib/seo/locale-keywords";
import { LOCALE_KEYWORDS } from "@/lib/seo/locale-keywords";
import {
  alternateLanguageUrls,
  generateCanonicalUrlForLocale,
  normalizePathForSeo,
  pathWithoutLocaleSegment,
} from "@/lib/site-url";

/** Данные страницы для сборки title/description/keywords и hreflang. */
export type LocalizedMetadataPageData = {
  /** Путь без префикса локали: "" | "/faq" | "/dtc/P0420" */
  pathWithoutLocale: string;
  title: string;
  description: string;
  /** Дополнительные ключевые слова к топ-5 локали */
  extraKeywords?: string[];
  /**
   * Сколько первых ключей из LOCALE_KEYWORDS добавить в конец description через запятую.
   * По умолчанию 0 — чтобы не раздувать сниппет; включайте 1–2 для узких лендингов.
   */
  appendKeywordsToDescription?: number;
  /**
   * Если true — в конец title добавляется « | {первое ключевое слово}», если оно ещё не встречается в title (без учёта регистра).
   */
  enrichTitleWithPrimaryKeyword?: boolean;
};

function defaultKeywords(locale: AppLocale): string[] {
  const list = LOCALE_KEYWORDS[locale] ?? LOCALE_KEYWORDS.en;
  return [...list];
}

/**
 * Собирает фрагмент Metadata: keywords по локали, canonical + alternates.languages,
 * опционально дополняет title/description ключевыми словами.
 */
export function generateLocalizedMetadata(
  locale: string,
  pageData: LocalizedMetadataPageData,
): Pick<Metadata, "title" | "description" | "keywords" | "alternates"> {
  const loc = locale as AppLocale;
  const pathNorm = normalizePathForSeo(pathWithoutLocaleSegment(pageData.pathWithoutLocale));
  const languages = alternateLanguageUrls(pathNorm);
  const canonical = generateCanonicalUrlForLocale(loc, pathNorm);

  const baseKw = defaultKeywords(loc);
  const extra = pageData.extraKeywords ?? [];
  const keywords = [...baseKw, ...extra];

  let title = pageData.title;
  const primary = baseKw[0];
  if (pageData.enrichTitleWithPrimaryKeyword && primary) {
    const hint = primary.slice(0, 12).toLowerCase();
    if (!title.toLowerCase().includes(hint)) {
      title = `${title} | ${primary}`;
    }
  }

  let description = pageData.description;
  const n = pageData.appendKeywordsToDescription ?? 0;
  if (n > 0 && baseKw.length > 0) {
    const tail = baseKw.slice(0, Math.min(n, baseKw.length)).join(", ");
    description = `${description} ${tail}.`;
  }

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages,
    },
  };
}
