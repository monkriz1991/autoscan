"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { Link, usePathname } from "@/i18n/navigation";
import { downloadProtectedAsset, type DownloadsAssetDto } from "@/lib/api";
import { formatFileSize } from "./formatFileSize";

type Props = {
  assets: DownloadsAssetDto[];
};

/** Какую CTA показать для вторичного установщика (учёт битого/устаревшего access из кэша). */
function secondaryAssetCta(
  asset: DownloadsAssetDto,
): "download" | "login_required" | "paid_required" {
  if (asset.access === "login_required") return "login_required";
  if (asset.access === "paid_required") return "paid_required";
  if (asset.access === "download") return "download";
  if (asset.download_api_url || asset.download_url) return "download";
  return "login_required";
}

export default function DownloadOptionsGrid({ assets }: Props) {
  const t = useTranslations("downloadPage");
  const pathname = usePathname();
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/download")}`;

  const [busyId, setBusyId] = useState<number | null>(null);

  const downloadOne = useCallback(
    async (asset: DownloadsAssetDto) => {
      const name =
        asset.download_label?.trim() ||
        `setup-${asset.os_type}-${asset.installer_type}`.replace(/[^a-z0-9._-]+/gi, "_");
      if (asset.download_api_url) {
        setBusyId(asset.id);
        try {
          await downloadProtectedAsset(asset.download_api_url, name);
        } finally {
          setBusyId(null);
        }
        return;
      }
      if (asset.download_url) {
        window.location.href = asset.download_url;
      }
    },
    [],
  );

  if (!assets.length) return null;

  return (
    <Stack gap="sm" mt="xl">
      <Text fw={600} size="lg">
        {t("otherDownloadsTitle")}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {assets.map((asset) => {
          const cta = secondaryAssetCta(asset);
          return (
            <Card key={asset.id}
              withBorder
              shadow="xs"
              padding="md"
              radius="md"
              className="download-option-card"
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} size="sm">
                    {asset.os_label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {asset.installer_label} · {formatFileSize(asset.file_size)}
                  </Text>
                </Stack>
                <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                  {cta === "download" && (
                    <Button
                      size="xs"
                      variant="filled"
                      className="btn-cta-primary"
                      leftSection={<IconDownload size={14} />}
                      loading={busyId === asset.id}
                      onClick={() => void downloadOne(asset)}
                    >
                      {t("ctaDownload")}
                    </Button>
                  )}
                  {cta === "login_required" && (
                    <Button size="xs" component={Link} href={loginHref} variant="default">
                      {t("ctaLoginRequired")}
                    </Button>
                  )}
                  {cta === "paid_required" && (
                    <Button size="xs" component={Link} href="/marketing/pricing" variant="default">
                      {t("ctaPaidRequired")}
                    </Button>
                  )}
                </Group>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
