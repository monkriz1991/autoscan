import { Badge, Card, Group, Image, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildLocalePageMetadata } from "@/lib/seo-metadata";
import { generateCanonicalUrl, localizedPath } from "@/lib/site-url";
import { getBlogPostsForLocale } from "@/lib/api";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function firstPageParam(page: string | string[] | undefined): string | undefined {
  if (typeof page === "string" && page.length > 0) return page;
  if (Array.isArray(page) && page[0]) return page[0];
  return undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const page = firstPageParam(sp.page);
  const base = await buildLocalePageMetadata(
    locale,
    "/blog",
    "blogTitle",
    "blogDescription",
    page ? { canonicalQuery: { page } } : undefined,
  );

  if (!page) {
    return base;
  }

  const qSuffix = `?${new URLSearchParams({ page })}`;
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = generateCanonicalUrl(`${localizedPath(loc, "/blog")}${qSuffix}`);
  }
  languages["x-default"] = languages[routing.defaultLocale];
  const canonical = languages[locale];

  return {
    ...base,
    alternates: {
      ...base.alternates,
      canonical,
      languages,
    },
    openGraph: {
      ...base.openGraph,
      url: canonical,
    },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  const t = await getTranslations({ locale, namespace: "blogPage" });
  const posts = await getBlogPostsForLocale(locale).catch((err) => {
    console.error("[BlogIndexPage] failed to load blog posts", err);
    return null;
  });

  return (
    <Stack component="section" gap="lg" className="marketing-page marketing-page--wide">
      <div className="marketing-page__hero">
        <h1 className="marketing-page__hero-title">{t("title")}</h1>
        <p className="marketing-page__hero-sub">{tSeo("blogDescription")}</p>
      </div>

      {posts === null ? (
        <Text c="red">{t("error")}</Text>
      ) : posts.length === 0 ? (
        <Text c="dimmed">{t("empty")}</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {posts.map((post) => (
            <Card
              key={post.slug}
              component={Link}
              href={`/blog/${post.slug}`}
              padding="lg"
              radius="lg"
              withBorder
              className="download-option-card"
              style={{ textDecoration: "none" }}
            >
              {post.cover_image_url ? (
                <Card.Section>
                  <Image src={post.cover_image_url} alt={post.title} h={180} fit="cover" />
                </Card.Section>
              ) : null}

              <Stack gap="sm" mt={post.cover_image_url ? "md" : 0}>
                <Group gap="xs">
                  {post.published_at ? (
                    <Text size="xs" c="dimmed">
                      {new Date(post.published_at).toLocaleDateString(locale)}
                    </Text>
                  ) : null}
                  {post.available_locales.length > 0 ? (
                    <Badge variant="light" color="gray" size="xs">
                      {post.available_locales.map((l) => l.toUpperCase()).join(", ")}
                    </Badge>
                  ) : null}
                </Group>
                <Title order={2} fz="h3">
                  {post.title}
                </Title>
                {post.excerpt ? (
                  <Text size="sm" c="dimmed">
                    {post.excerpt}
                  </Text>
                ) : null}
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
