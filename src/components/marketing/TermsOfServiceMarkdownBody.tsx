"use client";

import { Container, Stack, Text } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";

type Props = {
  /** Пустая строка — блок не показываем. */
  notice: string;
  markdown: string;
};

/**
 * Условия использования в Markdown: внутренние ссылки `/…` — через next-intl `Link`.
 * Стили — компактный юридический текст (как прежний Mantine `Text size="sm"`).
 */
export default function TermsOfServiceMarkdownBody({ notice, markdown }: Props) {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {notice.trim() ? (
          <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
            {notice}
          </Text>
        ) : null}
        <div className="terms-markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                if (href?.startsWith("/")) {
                  return (
                    <Link href={href} className="terms-markdown__link">
                      {children}
                    </Link>
                  );
                }
                return (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </Stack>
    </Container>
  );
}
