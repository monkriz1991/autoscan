"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Container, Loader, Stack, Text, Title } from "@mantine/core";
import DownloadHero from "@/components/downloads/DownloadHero";
import DownloadOptionsGrid from "@/components/downloads/DownloadOptionsGrid";
import ReleaseArchiveTable from "@/components/downloads/ReleaseArchiveTable";
import ReleaseNotesBlock from "@/components/downloads/ReleaseNotesBlock";
import { detectClientOs } from "@/lib/detectClientOs";
import type { ClientOs } from "@/lib/detectClientOs";
import { getDownloadsPage, type DownloadsPageDto } from "@/lib/api";

export default function DownloadPageContent() {
  const t = useTranslations("downloadPage");
  const [clientOs, setClientOs] = useState<ClientOs>("unknown");
  const [data, setData] = useState<DownloadsPageDto | null>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const os = await detectClientOs();
      if (cancelled) return;
      setClientOs(os);
      try {
        const page = await getDownloadsPage(os);
        if (!cancelled) {
          setData(page);
        }
      } catch {
        if (!cancelled) {
          setError(t("loadError"));
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const versionLabel = data?.latest?.version ?? "";

  return (
    <Container size="md" py="xl" className="download-page">
      <Title order={1} mb="xs" size="h2" fw={700}>
        {t("title")}
      </Title>
      <Text c="dimmed" size="sm" mb="lg">
        {t("subtitle")}
      </Text>

      {data === undefined && (
        <Stack align="center" py="xl">
          <Loader size="md" />
        </Stack>
      )}

      {error && (
        <Text c="red" size="sm" mb="md">
          {error}
        </Text>
      )}

      {data !== undefined && data !== null && (
        <>
          <DownloadHero
            clientOs={clientOs}
            versionLabel={versionLabel}
            asset={data.primary_asset}
          />
          <DownloadOptionsGrid assets={data.secondary_assets} />
          {data.latest ? (
            <ReleaseNotesBlock
              title={data.latest.title}
              notesShort={data.latest.release_notes_short}
              notesFull={data.latest.release_notes_full}
            />
          ) : null}
          <ReleaseArchiveTable rows={data.archive} />
        </>
      )}
    </Container>
  );
}
