# RSC и скорость загрузки

## Что было узким местом

1. **`?_rsc=...` в Network** — это запросы полезной нагрузки React Server Components при навигации в Next.js App Router. Они ждут серверный рендер страницы и всех **await** в дереве Server Components.

2. **SEO JSON-LD с бэкенда** (`GET /api/v1/seo/structured-data/`) добавлял задержку на каждый рендер layout/страниц, хотя в коде уже есть эквивалентные статические fallback’и.

3. **Тарифы на главной** (`GET .../billing/plans/`) блокировали весь `HomePageShell` до ответа API.

4. **Страницы «Скачать» и список блога** ждали `downloads/page/` и `blog/` до отдачи любого HTML.

5. **MP4 в `/vidio/`** — даже при малом размере ответа браузер может долго показывать «время» из‑за очереди запросов и частичной загрузки (206). Для блоков ниже fold включён `preload="none"` и постеры; для продакшена имеет смысл держать ролики на CDN и перекодировать под web (см. ниже).

## Что сделано в коде

- В **development** длительность серверных запросов логируется как `[SSR fetch] … : Nms` ([`src/lib/server-fetch-timing.ts`](../src/lib/server-fetch-timing.ts)), обёртки на SEO и ключевых SSR-fetch в API.
- **Глобальный и маркетинговый JSON-LD** строится статически без ожидания SEO API там, где это допустимо.
- **Тарифы на главной** вынесены в отдельный async-сегмент с `Suspense` ([`HomePricingSection`](../src/components/landing/HomePricingSection.tsx)).
- **Download / blog index** — данные в отдельных async-сегментах со скелетонами.
- **Landing video** — `preload="none"` и постеры, чтобы не конкурировать с первым рендером.

## Оставшиеся рекомендации (не код)

- Положить `preview.mp4`, `chatvideo.mp4`, `realtime.mp4` на CDN с HTTP/2 и кэшем `Cache-Control`.
- Перекодировать ролики (ниже битрейт, короче GOP, `-movflags +faststart`).
- В production замерять `next start` и реальный бэкенд; в dev `next dev` всегда медленнее.
