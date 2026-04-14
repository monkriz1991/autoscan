"use client";

import { Stack, Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import DownloadHero from "@/components/downloads/DownloadHero";
import DownloadOptionsGrid from "@/components/downloads/DownloadOptionsGrid";
import ReleaseArchiveTable from "@/components/downloads/ReleaseArchiveTable";
import type { DownloadsPageDto } from "@/lib/api";
import type { ClientOs } from "@/lib/detectClientOs";

type Props = {
  initialData: DownloadsPageDto | null;
  loadFailed: boolean;
};

export default function DownloadPageClient({ initialData, loadFailed }: Props) {
  const t = useTranslations("downloadPage");

  if (loadFailed || !initialData) {
    return (
      <div className="marketing-page marketing-page--wide">
        <div className="marketing-page__hero">
          <h1 className="marketing-page__hero-title">{t("title")}</h1>
          <p className="marketing-page__hero-sub">{t("loadError")}</p>
        </div>
      </div>
    );
  }

  const versionLabel = initialData.latest?.version ?? "—";
  const clientOs = (initialData.client_os || "unknown") as ClientOs;

  return (
    <Stack component="div" gap="xl" className="marketing-page marketing-page--wide">
      <div className="marketing-page__hero">
        <h1 className="marketing-page__hero-title">{t("title")}</h1>
        <p className="marketing-page__hero-sub">{t("subtitle")}</p>
      </div>

      <DownloadHero
        clientOs={clientOs}
        versionLabel={versionLabel}
        asset={initialData.primary_asset}
      />

      <DownloadOptionsGrid assets={initialData.secondary_assets} />

      <ReleaseArchiveTable rows={initialData.archive} />

      {initialData.latest?.release_notes_full ? (
        <Stack gap="sm" mt="md">
          <h2 className="marketing-page__section-title">{t("whatsNewTitle")}</h2>
          <Text size="sm" style={{ color: "var(--mp-text-muted)", lineHeight: 1.65 }}>
            {initialData.latest.release_notes_full}
          </Text>
        </Stack>
      ) : null}
    </Stack>
  );
}
