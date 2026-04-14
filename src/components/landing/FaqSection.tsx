"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Stack, Text, Title } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";

const FAQ_IDS = [1, 2, 3, 4, 5, 6] as const;

export default function FaqSection() {
  const t = useTranslations("landing.faq");
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <Stack component="section" gap="lg" py={56} pb={72} id="faq" className="landing-faq">
      <Title order={2} className="landing-section-title">
        {t("title")}
      </Title>

      {/* div вместо Mantine Box: у Box на клиенте иначе мержатся className/стили → hydration mismatch */}
      <div role="list" className="landing-faq__list">
        {FAQ_IDS.map((id) => {
          const isOpen = openId === id;
          return (
            <div key={id} className="landing-faq__item" role="listitem">
              <button
                type="button"
                id={`faq-trigger-${id}`}
                className="landing-faq__trigger"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${id}`}
                onClick={() => setOpenId(isOpen ? null : id)}
              >
                <Text fw={600} className="landing-faq__question" style={{ flex: 1, textAlign: "left" }}>
                  {t(`q${id}.q`)}
                </Text>
                <span className={`landing-faq__icon ${isOpen ? "landing-faq__icon--open" : ""}`} aria-hidden>
                  {isOpen ? <IconMinus size={20} stroke={2} /> : <IconPlus size={20} stroke={2} />}
                </span>
              </button>
              <div
                id={`faq-panel-${id}`}
                role="region"
                aria-labelledby={`faq-trigger-${id}`}
                className="landing-faq__panel"
                data-open={isOpen || undefined}
              >
                <div className="landing-faq__panel-inner">
                  <Text size="sm" style={{ color: "var(--text-muted)", lineHeight: 1.65 }}>
                    {t(`q${id}.a`)}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Stack>
  );
}
