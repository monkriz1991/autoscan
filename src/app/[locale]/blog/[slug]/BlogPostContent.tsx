"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Title, Text, Badge, Group, Button, Image, Box } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import type { BlogPostDetail } from "@/lib/api";

type Props = { post: BlogPostDetail };

export default function BlogPostContent({ post }: Props) {
  const t = useTranslations("blogPage");

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
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
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

      <div
        className="ck-content"
        dangerouslySetInnerHTML={{ __html: post.body_html }}
      />
    </article>
  );
}
