import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbListStructuredData,
  CANONICAL_SEO_SITE_NAME,
  normalizePublicSiteName,
} from "./static-structured-data";

describe("buildBreadcrumbListStructuredData", () => {
  it("три уровня: position, name, абсолютный item без лишнего слэша", () => {
    const doc = buildBreadcrumbListStructuredData("https://aiscanauto.com/es/dtc/P0420/", [
      { name: "Inicio", url: "https://aiscanauto.com/es/" },
      { name: "DTC", url: "https://aiscanauto.com/es/dtc/" },
      { name: "P0420", url: "https://aiscanauto.com/es/dtc/P0420/" },
    ]);
    const list = doc["@graph"][0] as Record<string, unknown>;
    expect(list["@type"]).toBe("BreadcrumbList");
    expect(list["@id"]).toBe("https://aiscanauto.com/es/dtc/P0420#breadcrumb");
    const els = list.itemListElement as Array<Record<string, unknown>>;
    expect(els).toHaveLength(3);
    expect(els[0]).toMatchObject({ position: 1, name: "Inicio", item: "https://aiscanauto.com/es" });
    expect(els[2]).toMatchObject({ position: 3, item: "https://aiscanauto.com/es/dtc/P0420" });
  });
});

describe("normalizePublicSiteName", () => {
  it("пустая строка → канон", () => {
    expect(normalizePublicSiteName("")).toBe(CANONICAL_SEO_SITE_NAME);
  });
  it("варианты написания AiScanAuto → AIscanAuto", () => {
    expect(normalizePublicSiteName("AiScanAuto")).toBe(CANONICAL_SEO_SITE_NAME);
    expect(normalizePublicSiteName("AI Scan Auto")).toBe(CANONICAL_SEO_SITE_NAME);
    expect(normalizePublicSiteName("aiscanauto")).toBe(CANONICAL_SEO_SITE_NAME);
  });
  it("иное имя не трогаем", () => {
    expect(normalizePublicSiteName("OtherBrand Co")).toBe("OtherBrand Co");
  });
});
