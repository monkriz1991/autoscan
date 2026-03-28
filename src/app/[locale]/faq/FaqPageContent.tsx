"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {
  Accordion,
  Avatar,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconPhoto, IconSearch } from "@tabler/icons-react";
import { getPublicFaq, type FaqPublicItem } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 320;
const AVATAR_SIZE = 56;

export default function FaqPageContent() {
  const t = useTranslations("faqPage");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQ = (searchParams.get("q") ?? "").trim();

  const [inputValue, setInputValue] = useState(urlQ);
  const [debouncedQ, setDebouncedQ] = useState(urlQ);
  const skipNextUrlSync = useRef(false);

  const [items, setItems] = useState<FaqPublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (skipNextUrlSync.current) {
      skipNextUrlSync.current = false;
      return;
    }
    setInputValue(urlQ);
    setDebouncedQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const tmr = window.setTimeout(() => {
      const next = inputValue.trim();
      setDebouncedQ(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      const qs = params.toString();
      if (qs === searchParams.toString()) return;
      skipNextUrlSync.current = true;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(tmr);
  }, [inputValue, pathname, router, searchParams]);

  const fetchItems = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicFaq(q ? { q } : undefined);
      setItems(data);
    } catch {
      setError(t("error"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchItems(debouncedQ);
  }, [debouncedQ, fetchItems]);

  const emptyMessage = useMemo(() => {
    if (debouncedQ) return t("noResults");
    return t("empty");
  }, [debouncedQ, t]);

  return (
    <div className="faq-page">
      <Title order={1} mb="xs" size="h2" fw={700}>
        {t("title")}
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        {t("subtitle")}
      </Text>

      <TextInput
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        leftSection={<IconSearch size={18} stroke={1.5} />}
        value={inputValue}
        onChange={(e) => setInputValue(e.currentTarget.value)}
        mb="xl"
        size="md"
        aria-label={t("searchLabel")}
      />

      {loading && (
        <Text size="sm" c="dimmed">
          {t("loading")}
        </Text>
      )}

      {!loading && error && (
        <Text size="sm" c="dimmed">
          {error}
        </Text>
      )}

      {!loading && !error && items.length === 0 && (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      )}

      {!loading && !error && items.length > 0 && (
        <Accordion
          variant="separated"
          radius="md"
          classNames={{ item: "faq-card-table__item", control: "faq-card-table__control" }}
        >
          {items.map((item) => {
            const codes =
              item.available_locales.length > 0
                ? item.available_locales.map((l) => l.toUpperCase()).join(" · ")
                : null;
            const cover = item.cover_image_url;

            return (
              <Accordion.Item key={item.slug} value={item.slug}>
                <Accordion.Control>
                  <div className="faq-card-table__row">
                    <div className="faq-card-table__thumb">
                      <Avatar
                        src={cover ?? undefined}
                        radius="md"
                        size={AVATAR_SIZE}
                        color="gray"
                        variant="light"
                        className="faq-card-table__avatar"
                      >
                        <IconPhoto size={28} stroke={1.5} aria-hidden />
                      </Avatar>
                    </div>
                    <Stack gap={6} className="faq-card-table__text" style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={600} size="md" className="faq-card-table__title">
                        {item.question}
                      </Text>
                      {codes ? (
                        <Text size="xs" c="dimmed" className="faq-card-table__locales">
                          {t("translations")}: {codes}
                        </Text>
                      ) : null}
                      {item.excerpt ? (
                        <Text size="sm" c="dimmed" lineClamp={3} className="faq-card-table__excerpt">
                          {item.excerpt}
                        </Text>
                      ) : null}
                    </Stack>
                  </div>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="md">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="faq-card-table__hero"
                      />
                    ) : null}
                    <div
                      className="faq-answer"
                      dangerouslySetInnerHTML={{ __html: item.answer_html }}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
