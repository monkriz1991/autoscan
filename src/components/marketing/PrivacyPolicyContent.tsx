import type { CSSProperties } from "react";
import type { LegalSiteInfo } from "@/lib/legal-site";

type PrivacyT = (
  key: string,
  values?: Record<string, string | number | boolean | Date | null | undefined>,
) => string;

const articleStyle: CSSProperties = {
  padding: "1rem 0 2.5rem",
  maxWidth: "48rem",
};

const muted: CSSProperties = { color: "#495057", lineHeight: 1.65 };

const h2Style: CSSProperties = {
  marginTop: "1.75rem",
  marginBottom: "0.75rem",
  fontSize: "1.25rem",
};

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ ...muted, paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
      {items.map((text) => (
        <li key={text.slice(0, 48)} style={{ marginBottom: "0.35rem" }}>
          {text}
        </li>
      ))}
    </ul>
  );
}

/** Полный текст политики конфиденциальности (строки из next-intl). */
export default function PrivacyPolicyContent({
  t,
  info,
}: {
  t: PrivacyT;
  info: LegalSiteInfo;
}) {
  const regPart = info.legalEntityReg
    ? t("regPart", { reg: info.legalEntityReg })
    : "";
  const hasPostalAddress = Boolean(info.legalEntityAddress);
  const hasPrivacyEmail = Boolean(info.privacyEmail);

  const s2Items = [t("s2_li1"), t("s2_li2"), t("s2_li3")];
  const s3Items = [
    t("s3_li1"),
    t("s3_li2"),
    t("s3_li3"),
    t("s3_li4"),
    t("s3_li5"),
    t("s3_li6"),
    t("s3_li7"),
  ];
  const s4Items = [t("s4_li1"), t("s4_li2"), t("s4_li3"), t("s4_li4")];
  const s5Items = [t("s5_li1"), t("s5_li2"), t("s5_li3"), t("s5_li4")];
  const s7Items = [t("s7_li1"), t("s7_li2"), t("s7_li3")];
  const s8Items = [t("s8_li1"), t("s8_li2"), t("s8_li3")];

  return (
    <article className="container" style={articleStyle}>
      <h1 style={{ marginBottom: "0.75rem" }}>{t("title")}</h1>
      <p style={{ ...muted, marginBottom: "1.25rem" }}>{t("lead")}</p>

      <h2 style={h2Style}>{t("s1h")}</h2>
      <p style={muted}>
        {t("s1_1", { siteDomain: info.siteDomain, siteOrigin: info.siteOrigin })}
      </p>
      <p style={muted}>{t("s1_2")}</p>
      <p style={muted}>{t("s1_3")}</p>
      <p style={muted}>
        {t("s1_4", {
          entity: info.legalEntityName,
          regPart,
          address: hasPostalAddress
            ? info.legalEntityAddress
            : t("fallbackAddress"),
          email: hasPrivacyEmail ? info.privacyEmail : t("fallbackEmail"),
        })}
      </p>

      <h2 style={h2Style}>{t("s2h")}</h2>
      <p style={muted}>{t("s2_intro")}</p>
      <Ul items={s2Items} />
      <p style={{ ...muted, marginTop: "0.75rem" }}>{t("s2_2")}</p>

      <h2 style={h2Style}>{t("s3h")}</h2>
      <p style={muted}>{t("s3_intro")}</p>
      <Ul items={s3Items} />
      <p style={{ ...muted, marginTop: "0.75rem" }}>{t("s3_2")}</p>

      <h2 style={h2Style}>{t("s4h")}</h2>
      <p style={muted}>{t("s4_intro")}</p>
      <Ul items={s4Items} />

      <h2 style={h2Style}>{t("s5h")}</h2>
      <p style={muted}>{t("s5_intro")}</p>
      <Ul items={s5Items} />
      <p style={{ ...muted, marginTop: "0.75rem" }}>{t("s5_2")}</p>
      <p style={muted}>{t("s5_3")}</p>

      <h2 style={h2Style}>{t("s6h")}</h2>
      <p style={muted}>{t("s6_1")}</p>
      <p style={muted}>{t("s6_2")}</p>
      <p style={muted}>{t("s6_3")}</p>

      <h2 style={h2Style}>{t("s7h")}</h2>
      <p style={muted}>{t("s7_intro")}</p>
      <Ul items={s7Items} />
      <p style={{ ...muted, marginTop: "0.75rem" }}>
        {hasPrivacyEmail
          ? t("s7_2_email", { email: info.privacyEmail })
          : t("s7_2_no_email")}
      </p>
      <p style={muted}>{t("s7_3")}</p>

      <h2 style={h2Style}>{t("s8h")}</h2>
      <p style={muted}>{t("s8_intro")}</p>
      <Ul items={s8Items} />
      <p style={{ ...muted, marginTop: "0.75rem" }}>{t("s8_2")}</p>

      <h2 style={h2Style}>{t("s9h")}</h2>
      <p style={muted}>{t("s9_1")}</p>
      <p style={muted}>{t("s9_2")}</p>
      <p style={muted}>{t("s9_3")}</p>

      <h2 style={h2Style}>{t("s10h")}</h2>
      <p style={muted}>{t("s10_intro")}</p>
      <ul style={{ ...muted, paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
        <li style={{ marginBottom: "0.35rem" }}>
          {hasPrivacyEmail
            ? t("s10_li_email", { email: info.privacyEmail })
            : t("s10_li_email_fallback")}
        </li>
        <li>
          {hasPostalAddress
            ? t("s10_li_address", { address: info.legalEntityAddress })
            : t("s10_li_address_fallback")}
        </li>
      </ul>
    </article>
  );
}
