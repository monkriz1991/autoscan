"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Title, Text, Badge, Group, Button, Image, Box } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import type { BlogPostDetail } from "@/lib/api";
import { extractDtcCodeFromSlug } from "@/lib/dtc-slug";

type Props = { post: BlogPostDetail };

/** Текст даты для <time> — с явной локалью next-intl, иначе SSR/браузер дадут разный toLocaleDateString() и сорвут гидратацию. */
function formatPostDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
}

export default function BlogPostContent({ post }: Props) {
  const t = useTranslations("blogPage");
  const locale = useLocale();
  const dtcFromSlug = extractDtcCodeFromSlug(post.slug);

  return (
    <article className="blog-post-page marketing-page">
      <Button
        component={Link}
        href="/blog"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="lg"
        className="blog-post-page__back"
        c="dimmed"
      >
        {t("backToList")}
      </Button>

      {post.cover_image_url ? (
        <Box className="blog-post-page__cover">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            h={380}
            w="100%"
            fit="cover"
            radius={0}
          />
        </Box>
      ) : null}

      <div className="blog-post-page__meta">
        <time dateTime={post.published_at}>
          {post.published_at ? formatPostDate(post.published_at, locale) : ""}
        </time>
        {post.available_locales.length > 0 && (
          <Badge color="gray" variant="light" size="xs">
            {post.available_locales.map((l) => l.toUpperCase()).join(", ")}
          </Badge>
        )}
      </div>

      <Title order={1} className="blog-post-page__title">
        {post.title}
      </Title>

      {post.excerpt ? (
        <p className="blog-post-page__excerpt">{post.excerpt}</p>
      ) : null}

      {dtcFromSlug ? (
        <Box
          className="blog-post-page__dtc-cta"
          mb="lg"
          p="md"
          style={{
            borderRadius: 8,
            border: "1px solid color-mix(in srgb, var(--mantine-color-gray-5) 40%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--mantine-color-gray-1) 80%, transparent)",
          }}
        >
          <Text size="sm" c="dimmed" mb="xs">
            {t("dtcArticleDescription")}
          </Text>
          <Button
            component={Link}
            href={`/dtc/${dtcFromSlug}`}
            variant="light"
            size="sm"
          >
            {t("dtcArticleCta", { code: dtcFromSlug })}
          </Button>
        </Box>
      ) : null}

      <div
        className="ck-content"
        dangerouslySetInnerHTML={{ __html: post.body_html }}
      />
    </article>
  );
}
