"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { Link, usePathname } from "@/i18n/navigation";
import { downloadProtectedAsset, type DownloadsAssetDto } from "@/lib/api";
import type { ClientOs } from "@/lib/detectClientOs";
import { formatFileSize } from "./formatFileSize";

type Props = {
  clientOs: ClientOs;
  versionLabel: string;
  asset: DownloadsAssetDto | null;
};

export default function DownloadHero({ clientOs, versionLabel, asset }: Props) {
  const t = useTranslations("downloadPage");
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loginHref = `/login?next=${encodeURIComponent(pathname || "/download")}`;

  const bannerKey = ((): string => {
    if (clientOs === "windows") return "heroRecommendedWindows";
    if (clientOs === "macos_arm" || clientOs === "macos_intel") return "heroRecommendedMac";
    if (clientOs === "linux") return "heroRecommendedLinux";
    return "heroRecommendedDefault";
  })();

  const runDownload = useCallback(async () => {
    if (!asset) return;
    setErr(null);
    const name =
      asset.download_label?.trim() ||
      `setup-${asset.os_type}-${asset.installer_type}`.replace(/[^a-z0-9._-]+/gi, "_");
    if (asset.download_api_url) {
      setBusy(true);
      try {
        await downloadProtectedAsset(asset.download_api_url, name);
      } catch {
        setErr(t("downloadError"));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (asset.download_url) {
      window.location.href = asset.download_url;
    }
  }, [asset, t]);

  if (!asset) {
    return (
      <Paper shadow="sm" p="xl" radius="md" withBorder className="download-hero">
        <Title order={2} size="h3" mb="xs">
          {t("heroEmptyTitle")}
        </Title>
        <Text c="dimmed" size="sm">
          {t("heroEmptyBody")}
        </Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="md" p="xl" radius="md" withBorder className="download-hero download-hero--primary">
      <Stack gap="md">
        <div>
          <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
            {t(bannerKey)}
          </Text>
          <Title order={2} size="h2" mt={4}>
            {asset.os_label} · {t("installer")}: {asset.installer_label}
          </Title>
          <Text c="dimmed" size="sm" mt="xs">
            {t("version")} {versionLabel} · {formatFileSize(asset.file_size)}
          </Text>
        </div>

        <Group gap="sm" align="flex-start" wrap="wrap">
          {asset.access === "download" && (
            <Button
              size="lg"
              leftSection={<IconDownload size={20} />}
              onClick={() => void runDownload()}
              loading={busy}
              className="btn-metallic"
            >
              {t("ctaDownload")}
            </Button>
          )}
          {asset.access === "login_required" && (
            <Button size="lg" component={Link} href={loginHref} variant="filled">
              {t("ctaLogin")}
            </Button>
          )}
          {asset.access === "paid_required" && (
            <Group gap="sm">
              <Button size="lg" component={Link} href={loginHref} variant="default">
                {t("ctaLogin")}
              </Button>
              <Button size="lg" component={Link} href="/marketing/pricing" variant="filled">
                {t("ctaUpgrade")}
              </Button>
            </Group>
          )}
        </Group>

        {asset.checksum_sha256 ? (
          <Text size="xs" c="dimmed" style={{ wordBreak: "break-all" }}>
            SHA-256: {asset.checksum_sha256}
          </Text>
        ) : (
          <Text size="xs" c="dimmed">
            {t("noChecksum")}
          </Text>
        )}

        {err && (
          <Text size="sm" c="red">
            {err}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
