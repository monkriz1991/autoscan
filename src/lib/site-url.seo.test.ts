import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  alternateLanguageUrls,
  alternateLanguageUrlsForLocales,
  generateCanonicalUrlForLocale,
} from "./site-url";

describe("site-url SEO helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://aiscanauto.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("canonical default locale без префикса /en", () => {
    expect(generateCanonicalUrlForLocale("en", "/dtc/B1360")).toBe("https://aiscanauto.com/dtc/B1360");
  });

  it("canonical non-default locale с префиксом", () => {
    expect(generateCanonicalUrlForLocale("es", "/dtc/B1360")).toBe("https://aiscanauto.com/es/dtc/B1360");
  });

  it("полный hreflang-кластер + x-default", () => {
    const m = alternateLanguageUrls("/dtc/B1360");
    expect(m.en).toBe("https://aiscanauto.com/dtc/B1360");
    expect(m.es).toBe("https://aiscanauto.com/es/dtc/B1360");
    expect(m["x-default"]).toBe("https://aiscanauto.com/dtc/B1360");
  });

  it("частичный hreflang: только переданные локали и x-default", () => {
    const m = alternateLanguageUrlsForLocales("/dtc/B1360", ["en", "es"]);
    expect(m.en).toBe("https://aiscanauto.com/dtc/B1360");
    expect(m.es).toBe("https://aiscanauto.com/es/dtc/B1360");
    expect(m["x-default"]).toBe("https://aiscanauto.com/dtc/B1360");
    expect(m.it).toBeUndefined();
  });

  it("пустой набор локалей — пустой объект (fallback на уровне страницы)", () => {
    expect(alternateLanguageUrlsForLocales("/dtc/B1360", [])).toEqual({});
  });
});
