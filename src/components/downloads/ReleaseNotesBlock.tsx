"use client";

import { useTranslations } from "next-intl";
import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

type Props = {
  title: string;
  notesShort: string;
  notesFull: string;
};

export default function ReleaseNotesBlock({ title, notesShort, notesFull }: Props) {
  const t = useTranslations("downloadPage");
  const [open, { toggle }] = useDisclosure(false);

  if (!notesShort && !notesFull) return null;

  return (
    <Stack gap="sm" mt="xl" className="download-release-notes">
      <Title order={3} size="h4">
        {t("whatsNewTitle")}
      </Title>
      {title && (
        <Text fw={600} size="md">
          {title}
        </Text>
      )}
      {notesShort ? (
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {notesShort}
        </Text>
      ) : null}
      {notesFull ? (
        <>
          <Anchor component="button" type="button" size="sm" onClick={toggle}>
            {open ? t("hideFullNotes") : t("showFullNotes")}
          </Anchor>
          {open ? (
            <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
              {notesFull}
            </Text>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
