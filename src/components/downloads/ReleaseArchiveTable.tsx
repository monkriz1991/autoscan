"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  downloadProtectedAsset,
  type DownloadsArchiveRow,
  type DownloadsAssetDto,
} from "@/lib/api";
import { formatFileSize } from "./formatFileSize";

type Props = {
  rows: DownloadsArchiveRow[];
};

function AssetButtons({ assets }: { assets: DownloadsAssetDto[] }) {
  const t = useTranslations("downloadPage");
  const pathname = usePathname();
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/download")}`;
  const [busyId, setBusyId] = useState<number | null>(null);

  const downloadOne = useCallback(async (asset: DownloadsAssetDto) => {
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
  }, []);

  return (
    <Group gap={6} wrap="wrap">
      {assets.map((asset) => (
        <span key={asset.id}>
          {asset.access === "download" && (
            <Button
              size="compact-xs"
              variant="light"
              leftSection={<IconDownload size={12} />}
              loading={busyId === asset.id}
              onClick={() => void downloadOne(asset)}
            >
              {asset.os_label}
            </Button>
          )}
          {asset.access === "login_required" && (
            <Button size="compact-xs" component={Link} href={loginHref} variant="default">
              {asset.os_label} ({t("ctaLoginRequired")})
            </Button>
          )}
          {asset.access === "paid_required" && (
            <Button size="compact-xs" component={Link} href="/pricing" variant="default">
              {asset.os_label} ({t("ctaPaidRequired")})
            </Button>
          )}
        </span>
      ))}
    </Group>
  );
}

export default function ReleaseArchiveTable({ rows }: Props) {
  const t = useTranslations("downloadPage");

  if (!rows.length) {
    return (
      <Stack gap="sm" mt="xl">
        <Title order={3} size="h4">
          {t("archiveTitle")}
        </Title>
        <Text c="dimmed" size="sm">
          {t("archiveEmpty")}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap="md" mt="xl" className="download-archive">
      <Title order={3} size="h4">
        {t("archiveTitle")}
      </Title>

      <Box style={{ overflowX: "auto" }} visibleFrom="sm">
        <Table striped highlightOnHover withTableBorder withColumnBorders style={{ minWidth: 640 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("colVersion")}</Table.Th>
              <Table.Th>{t("colPublished")}</Table.Th>
              <Table.Th>{t("colNotes")}</Table.Th>
              <Table.Th>{t("colFiles")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.release.id}>
                <Table.Td fw={600}>{row.release.version}</Table.Td>
                <Table.Td>
                  {row.release.published_at
                    ? new Date(row.release.published_at).toLocaleDateString()
                    : "—"}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={3}>
                    {row.release.release_notes_short || "—"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <AssetButtons assets={row.assets} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <Stack gap="md" hiddenFrom="sm">
        {rows.map((row) => (
          <Paper key={row.release.id} withBorder p="md" radius="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={700}>{row.release.version}</Text>
                <Text size="xs" c="dimmed">
                  {row.release.published_at
                    ? new Date(row.release.published_at).toLocaleDateString()
                    : ""}
                </Text>
              </Group>
              <Text size="sm" c="dimmed" lineClamp={4}>
                {row.release.release_notes_short || "—"}
              </Text>
              <AssetButtons assets={row.assets} />
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
