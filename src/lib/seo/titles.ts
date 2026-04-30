/**
 * Единые шаблоны SEO title (бренд в строке) — используйте с `title: { absolute: ... }`,
 * иначе layout добавит суффикс `| siteName` повторно.
 */
export const buildTitle = {
  /** Абсолютный title главной — без суффикса layout `%s | siteName`. */
  home: (_locale: string) =>
    `AI Car Diagnostics — Free OBD2 Scanner | AiScanAuto`,

  /** Юридические страницы — абсолютные строки (бренд «AiScanAuto» единообразно). */
  terms: () => `Terms of Use — AiScanAuto`,

  privacy: () => `Privacy Policy — AiScanAuto`,

  blogList: (_locale: string) => `Auto Diagnostics Blog — AiScanAuto`,

  /** Пустой title → null (страница должна получить noindex). */
  blogPost: (title: string) => {
    const t = title.trim();
    return t ? `${t} — AiScanAuto` : null;
  },

  blogListPage: (_locale: string, page: number) =>
    page > 1
      ? `Auto Diagnostics Blog — Page ${page} — AiScanAuto`
      : `Auto Diagnostics Blog — AiScanAuto`,

  dtcList: () => `OBD2 DTC Error Codes Database — AiScanAuto`,

  dtcListPage: (page: number) =>
    page > 1
      ? `OBD2 DTC Error Codes Database — Page ${page} — AiScanAuto`
      : `OBD2 DTC Error Codes Database — AiScanAuto`,

  dtcCode: (code: string, description: string) => {
    const d = description.trim();
    return d ? `${code}: ${d} — AiScanAuto` : `${code} — OBD2 DTC — AiScanAuto`;
  },

  faq: () => `FAQ: Auto Diagnostics Help — AiScanAuto`,

  pricing: () => `Plans & Pricing — AiScanAuto`,

  about: () => `About AiScanAuto — AI Vehicle Diagnostics`,

  download: (os: string) => `Download AiScanAuto for ${os} — Free App`,

  contacts: () => `Contacts — AiScanAuto`,
};
