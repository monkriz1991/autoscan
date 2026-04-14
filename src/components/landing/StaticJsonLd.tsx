/** Сырой JSON-LD (не формат @graph с бэкенда). */
export default function StaticJsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD по рекомендации Google
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
