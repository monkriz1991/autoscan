"use client";

import { useTranslations } from "next-intl";
import { Accordion, Stack, Text, Title } from "@mantine/core";
import type { Plan } from "@/lib/api";
import { PricingPlansGrid, sortPlansForDisplay } from "@/components/marketing/PricingPlanCards";

function PricingFaq() {
  const t = useTranslations("pricing");
  return (
    <Stack gap="md" mt={56} className="pricing-v2-faq">
      <Title order={2} size="h3" className="pricing-v2-section-title">
        {t("faqTitle")}
      </Title>
      <Accordion
        variant="separated"
        radius="md"
        className="pricing-v2-faq__accordion"
        classNames={{
          control: "pricing-v2-faq__control",
          item: "pricing-v2-faq__item",
          panel: "pricing-v2-faq__panel",
        }}
      >
        <Accordion.Item value="switch">
          <Accordion.Control>{t("faq_switch_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_switch_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="trial">
          <Accordion.Control>{t("faq_trial_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_trial_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="limit">
          <Accordion.Control>{t("faq_limit_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_limit_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="annual">
          <Accordion.Control>{t("faq_annual_q")}</Accordion.Control>
          <Accordion.Panel>
            <Text size="sm" c="dimmed">
              {t("faq_annual_a")}
            </Text>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}

export type PricingPageContentProps = {
  plans: Plan[];
};

/** Карточки и FAQ для витрины тарифов. */
export function PricingPageContent({ plans }: PricingPageContentProps) {
  const sorted = sortPlansForDisplay(plans);

  return (
    <Stack gap={0}>
      <PricingPlansGrid plans={sorted} />

      <PricingFaq />
    </Stack>
  );
}
