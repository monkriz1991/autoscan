"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Title, Text, Button, Badge, Group, Container, Box } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { getBlogPost, type BlogPostDetail } from "@/lib/api";
import Image from "next/image";

export default function BlogPostContent({ slug }: { slug: string }) {
  const t = useTranslations("blogPage");
  const router = useRouter();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      try {
        const data = await getBlogPost(slug);
        setPost(data);
      } catch (err: any) {
        if (err.status === 404) {
          setError(t("notFound"));
        } else {
          setError(t("error"));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug, t]);

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Text size="sm" c="dimmed">{t("loading")}</Text>
      </Container>
    );
  }

  if (error || !post) {
    return (
      <Container size="md" py="xl">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push("/blog")} mb="lg">
          {t("backToList")}
        </Button>
        <Text size="sm" c="dimmed">{error}</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl" className="blog-post">
      <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push("/blog")} mb="lg">
        {t("backToList")}
      </Button>

      {post.cover_image_url && (
        <Box mb="xl" style={{ position: "relative", width: "100%", height: 400, borderRadius: 8, overflow: "hidden" }}>
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </Box>
      )}

      <Title order={1} mb="sm" size="h1" fw={800}>
        {post.title}
      </Title>

      <Group mb="xl">
        <Text size="sm" c="dimmed">
          {new Date(post.published_at).toLocaleDateString()}
        </Text>
        {post.available_locales.length > 0 && (
          <Badge color="gray" variant="light" size="xs">
            {post.available_locales.map((l) => l.toUpperCase()).join(", ")}
          </Badge>
        )}
      </Group>

      {post.excerpt && (
        <Text size="lg" mb="xl" fw={500}>
          {post.excerpt}
        </Text>
      )}

      <div
        className="ck-content"
        style={{ marginTop: "2rem", lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: post.body_html }}
      />
    </Container>
  );
}
