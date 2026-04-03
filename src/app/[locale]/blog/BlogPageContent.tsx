"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Title,
  Text,
  Card,
  Image,
  SimpleGrid,
  Group,
  Badge,
} from "@mantine/core";
import { getBlogPosts, type BlogPostItem } from "@/lib/api";

export default function BlogPageContent() {
  const t = useTranslations("blogPage");
  const [items, setItems] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const data = await getBlogPosts();
        setItems(data);
      } catch {
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [t]);

  const emptyMessage = useMemo(() => {
    return t("empty");
  }, [t]);

  return (
    <div className="blog-page">
      <Title order={1} mb="xs" size="h2" fw={700}>
        {t("title")}
      </Title>
      <Text c="dimmed" size="sm" mb="xl">
        {t("subtitle")}
      </Text>

      {loading && (
        <Text size="sm" c="dimmed">
          {t("loading")}
        </Text>
      )}

      {!loading && error && (
        <Text size="sm" c="dimmed">
          {error}
        </Text>
      )}

      {!loading && !error && items.length === 0 && (
        <Text size="sm" c="dimmed">
          {emptyMessage}
        </Text>
      )}

      {!loading && !error && items.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {items.map((post) => (
            <Card
              key={post.slug}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              component={Link}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}
            >
              <Card.Section>
                <Image
                  src={post.cover_image_url || "/car-hero.png"}
                  height={160}
                  alt={post.title}
                />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500} lineClamp={2} style={{ flex: 1 }}>
                  {post.title}
                </Text>
              </Group>

              <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
                {post.excerpt}
              </Text>

              <Group justify="space-between" mt="md">
                <Text size="xs" c="dimmed">
                  {new Date(post.published_at).toLocaleDateString()}
                </Text>
                {post.available_locales.length > 0 && (
                  <Badge color="gray" variant="light" size="xs">
                    {post.available_locales.map((l) => l.toUpperCase()).join(", ")}
                  </Badge>
                )}
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </div>
  );
}
