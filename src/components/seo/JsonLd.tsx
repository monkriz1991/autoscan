import type { StructuredDataDoc } from "@/lib/seo/structured-data";
import { safeStringifyStructuredData } from "@/lib/seo/structured-data";

type Props = {
  data: StructuredDataDoc | null;
};

export default function JsonLd({ data }: Props) {
  if (!data || !Array.isArray(data["@graph"]) || data["@graph"].length === 0) {
    return null;
  }
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD по рекомендации Google
      dangerouslySetInnerHTML={{ __html: safeStringifyStructuredData(data) }}
    />
  );
}
