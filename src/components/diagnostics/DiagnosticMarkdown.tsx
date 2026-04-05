"use client";

import { Box } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

type Props = {
  source: string;
  className?: string;
};

/**
 * Рендер ответа ИИ: Markdown + кликабельные внешние ссылки.
 */
export function DiagnosticMarkdown({ source, className }: Props) {
  return (
    <Box
      className={className}
      style={{
        fontSize: "var(--mantine-font-size-sm)",
        lineHeight: 1.45,
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {source}
      </ReactMarkdown>
    </Box>
  );
}
