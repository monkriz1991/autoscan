"use client";

import { Fragment, useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Box } from "@mantine/core";
import { useRevealOnScroll } from "./useRevealOnScroll";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type AnimState = {
  badge: boolean;
  headline: boolean;
  desc: boolean;
  learnMore: boolean;
  cardCol: boolean;
  notif1: boolean;
  notif2: boolean;
  chartWrap: boolean;
  chartDrawn: boolean;
  dots: boolean;
  cardFloat: boolean;
};

const animInitial: AnimState = {
  badge: false,
  headline: false,
  desc: false,
  learnMore: false,
  cardCol: false,
  notif1: false,
  notif2: false,
  chartWrap: false,
  chartDrawn: false,
  dots: false,
  cardFloat: false,
};

const animAllTrue: AnimState = {
  badge: true,
  headline: true,
  desc: true,
  learnMore: true,
  cardCol: true,
  notif1: true,
  notif2: true,
  chartWrap: true,
  chartDrawn: true,
  dots: true,
  cardFloat: true,
};

type Props = {
  /** Ключи next-intl с полями как у f2 (tag, title, body, cardTitle, notifGreen, …) */
  namespace: string;
};

/**
 * Панель «Predict problems…» по макету blog-finder-block.html — общая для f2 и f3.
 */
export default function PredictProblemsPanel({ namespace }: Props) {
  const t = useTranslations(namespace);
  const { ref, visible } = useRevealOnScroll<HTMLElement>(0.2);
  const chartGradId = useId().replace(/:/g, "");
  const titleId = useId();
  const [anim, setAnim] = useState<AnimState>(animInitial);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const run = async () => {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        setAnim(animAllTrue);
        return;
      }

      await delay(100);
      if (cancelled) return;
      setAnim((s) => ({ ...s, badge: true }));
      await delay(160);
      if (cancelled) return;
      setAnim((s) => ({ ...s, headline: true }));
      await delay(150);
      if (cancelled) return;
      setAnim((s) => ({ ...s, desc: true }));
      await delay(140);
      if (cancelled) return;
      setAnim((s) => ({ ...s, learnMore: true }));
      await delay(60);
      if (cancelled) return;
      setAnim((s) => ({ ...s, cardCol: true }));
      await delay(360);
      if (cancelled) return;
      setAnim((s) => ({ ...s, notif1: true }));
      await delay(220);
      if (cancelled) return;
      setAnim((s) => ({ ...s, notif2: true }));
      await delay(280);
      if (cancelled) return;
      setAnim((s) => ({ ...s, chartWrap: true }));
      await delay(60);
      if (cancelled) return;
      setAnim((s) => ({ ...s, chartDrawn: true }));
      await delay(1550);
      if (cancelled) return;
      setAnim((s) => ({ ...s, dots: true }));
      await delay(250);
      if (cancelled) return;
      setAnim((s) => ({ ...s, cardFloat: true }));
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const titleLines = t("title").split("\n");

  return (
    <Box
      component="section"
      ref={ref}
      className={`landing-predict-feature ${visible ? "landing-predict-feature--in-view" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="landing-predict-feature__panel">
        <div className="landing-predict-feature__text-col">
          <span
            className={`landing-predict-feature__badge ${anim.badge ? "landing-predict-feature__badge--visible" : ""}`}
          >
            {t("tag")}
          </span>
          <h2
            id={titleId}
            className={`landing-predict-feature__headline ${anim.headline ? "landing-predict-feature__headline--visible" : ""}`}
          >
            {titleLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </h2>
          <p
            className={`landing-predict-feature__description ${anim.desc ? "landing-predict-feature__description--visible" : ""}`}
          >
            {t("body")}
          </p>
          <Link
            href="/marketing/pricing"
            className={`landing-predict-feature__learn-more ${anim.learnMore ? "landing-predict-feature__learn-more--visible" : ""}`}
          >
            {t("learnMore")}
          </Link>
        </div>

        <div
          className={`landing-predict-feature__card-col ${anim.cardCol ? "landing-predict-feature__card-col--visible" : ""}`}
        >
          <div
            className={`landing-predict-feature__card ${anim.cardFloat ? "landing-predict-feature__card--floating" : ""}`}
          >
            <div className="landing-predict-feature__card-title">{t("cardTitle")}</div>

            <div
              className={`landing-predict-feature__notif landing-predict-feature__notif--green ${anim.notif1 ? "landing-predict-feature__notif--visible" : ""}`}
            >
              {t("notifGreen")}
            </div>

            <div
              className={`landing-predict-feature__notif landing-predict-feature__notif--amber ${anim.notif2 ? "landing-predict-feature__notif--visible" : ""} ${anim.notif2 ? "landing-predict-feature__notif--amber-pulse" : ""}`}
            >
              {t("notifAmber")}
            </div>

            <div
              className={`landing-predict-feature__chart-wrap ${anim.chartWrap ? "landing-predict-feature__chart-wrap--visible" : ""}`}
            >
              <svg viewBox="0 0 280 76" preserveAspectRatio="none" aria-hidden className="landing-predict-feature__chart-svg">
                <defs>
                  <linearGradient id={chartGradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a3fcc" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#1a3fcc" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <line className="landing-predict-feature__chart-grid" x1="0" y1="20" x2="280" y2="20" />
                <line className="landing-predict-feature__chart-grid" x1="0" y1="40" x2="280" y2="40" />
                <line className="landing-predict-feature__chart-grid" x1="0" y1="60" x2="280" y2="60" />

                <path
                  className={`landing-predict-feature__chart-area ${anim.chartDrawn ? "landing-predict-feature__chart-area--visible" : ""}`}
                  fill={`url(#${chartGradId})`}
                  d="M0,66 L35,54 L70,38 L100,45 L130,26 L160,32 L195,12 L220,36 L248,20 L270,24 L280,22 L280,76 L0,76 Z"
                />

                <path
                  className={`landing-predict-feature__chart-line ${anim.chartDrawn ? "landing-predict-feature__chart-line--drawn" : ""}`}
                  d="M0,66 L35,54 L70,38 L100,45 L130,26 L160,32 L195,12 L220,36 L248,20 L270,24"
                />

                <g transform="translate(270, 24)">
                  <circle
                    className={`landing-predict-feature__dot-ring ${anim.dots ? "landing-predict-feature__dot-ring--visible" : ""}`}
                    cx="0"
                    cy="0"
                    r="5"
                    fill="none"
                    stroke="#1a3fcc"
                    strokeWidth="1.5"
                  />
                  <circle
                    className={`landing-predict-feature__dot-core ${anim.dots ? "landing-predict-feature__dot-core--visible" : ""}`}
                    cx="0"
                    cy="0"
                    r="3.5"
                  />
                </g>

                <text className="landing-predict-feature__chart-label" x="0" y="76">
                  {t("chartMon")}
                </text>
                <text className="landing-predict-feature__chart-label" x="92" y="76">
                  {t("chartWed")}
                </text>
                <text className="landing-predict-feature__chart-label" x="188" y="76">
                  {t("chartFri")}
                </text>
                <text className="landing-predict-feature__chart-label" x="255" y="76">
                  {t("chartSun")}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
}
