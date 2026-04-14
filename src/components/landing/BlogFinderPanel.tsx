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
  cardCol: boolean;
  searchBar: boolean;
  typedText: string;
  cursorVisible: boolean;
  spinnerOpaque: boolean;
  skel1: boolean;
  skel2: boolean;
  skel3: boolean;
  art1: boolean;
  art1Visible: boolean;
  div1: boolean;
  art2: boolean;
  art2Visible: boolean;
  div2: boolean;
  art3: boolean;
  art3Visible: boolean;
  aiLabel: boolean;
  cardFloat: boolean;
  badge: boolean;
  headline: boolean;
  desc: boolean;
  learnMore: boolean;
};

const animInitial: AnimState = {
  cardCol: false,
  searchBar: false,
  typedText: "",
  cursorVisible: true,
  spinnerOpaque: false,
  skel1: true,
  skel2: true,
  skel3: true,
  art1: false,
  art1Visible: false,
  div1: false,
  art2: false,
  art2Visible: false,
  div2: false,
  art3: false,
  art3Visible: false,
  aiLabel: false,
  cardFloat: false,
  badge: false,
  headline: false,
  desc: false,
  learnMore: false,
};

const animFinal: AnimState = {
  cardCol: true,
  searchBar: true,
  typedText: "", // заполним из перевода
  cursorVisible: false,
  spinnerOpaque: false,
  skel1: false,
  skel2: false,
  skel3: false,
  art1: true,
  art1Visible: true,
  div1: true,
  art2: true,
  art2Visible: true,
  div2: true,
  art3: true,
  art3Visible: true,
  aiLabel: true,
  cardFloat: true,
  badge: true,
  headline: true,
  desc: true,
  learnMore: true,
};

type Props = {
  namespace: string;
};

/**
 * Блок «Blog finder» по макету blog-finder-block (1).html: карточка поиска слева, текст справа.
 */
export default function BlogFinderPanel({ namespace }: Props) {
  const t = useTranslations(namespace);
  const { ref, visible } = useRevealOnScroll<HTMLElement>(0.2);
  const titleId = useId();
  const [anim, setAnim] = useState<AnimState>(animInitial);

  const searchQuery = t("searchQuery");

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const run = async () => {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        setAnim({ ...animFinal, typedText: searchQuery });
        return;
      }

      await delay(100);
      if (cancelled) return;
      setAnim((s) => ({ ...s, cardCol: true }));
      await delay(380);
      if (cancelled) return;
      setAnim((s) => ({ ...s, searchBar: true }));
      await delay(350);
      if (cancelled) return;

      let text = "";
      for (const ch of searchQuery) {
        if (cancelled) return;
        await delay(60 + Math.random() * 30);
        text += ch;
        setAnim((s) => ({ ...s, typedText: text }));
      }

      if (cancelled) return;
      setAnim((s) => ({ ...s, cursorVisible: false, spinnerOpaque: true }));
      await delay(900);
      if (cancelled) return;
      setAnim((s) => ({ ...s, spinnerOpaque: false }));

      setAnim((s) => ({
        ...s,
        skel1: false,
        art1: true,
        div1: true,
      }));
      await delay(40);
      if (cancelled) return;
      setAnim((s) => ({ ...s, art1Visible: true, div1: true }));
      await delay(260);
      if (cancelled) return;

      setAnim((s) => ({
        ...s,
        skel2: false,
        art2: true,
        div2: true,
      }));
      await delay(40);
      if (cancelled) return;
      setAnim((s) => ({ ...s, art2Visible: true, div2: true }));
      await delay(260);
      if (cancelled) return;

      setAnim((s) => ({ ...s, skel3: false, art3: true }));
      await delay(40);
      if (cancelled) return;
      setAnim((s) => ({ ...s, art3Visible: true }));
      await delay(300);
      if (cancelled) return;

      setAnim((s) => ({ ...s, aiLabel: true }));
      await delay(300);
      if (cancelled) return;
      setAnim((s) => ({ ...s, cardFloat: true }));
      await delay(50);
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
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [visible, searchQuery]);

  const titleLines = t("title").split("\n");

  return (
    <Box
      component="section"
      ref={ref}
      className={`landing-blog-finder ${visible ? "landing-blog-finder--in-view" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="landing-blog-finder__section">
        <div
          className={`landing-blog-finder__card-col ${anim.cardCol ? "landing-blog-finder__card-col--visible" : ""}`}
        >
          <div
            className={`landing-blog-finder__outer-card ${anim.cardFloat ? "landing-blog-finder__outer-card--floating" : ""}`}
          >
            <div>
              <div className="landing-blog-finder__card-header-title">{t("cardTitle")}</div>
              <div className="landing-blog-finder__card-sub">{t("cardSub")}</div>
            </div>

            <div
              className={`landing-blog-finder__search-bar ${anim.searchBar ? "landing-blog-finder__search-bar--visible" : ""}`}
            >
              <svg
                className="landing-blog-finder__search-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <div className="landing-blog-finder__search-text">
                <span className="landing-blog-finder__typed-text">{anim.typedText}</span>
                {anim.cursorVisible ? <span className="landing-blog-finder__cursor" aria-hidden /> : null}
              </div>
              <div
                className="landing-blog-finder__search-spinner"
                style={{ opacity: anim.spinnerOpaque ? 1 : 0 }}
                aria-hidden
              />
            </div>

            <div className="landing-blog-finder__results-card">
              {anim.skel1 ? (
                <div className="landing-blog-finder__skeleton-row">
                  <div className="landing-blog-finder__skel landing-blog-finder__skel-circle" />
                  <div className="landing-blog-finder__skel-lines">
                    <div className="landing-blog-finder__skel landing-blog-finder__skel-line" />
                    <div className="landing-blog-finder__skel landing-blog-finder__skel-line landing-blog-finder__skel-line--short" />
                  </div>
                </div>
              ) : null}
              {anim.skel2 ? (
                <div className="landing-blog-finder__skeleton-row">
                  <div className="landing-blog-finder__skel landing-blog-finder__skel-circle" />
                  <div className="landing-blog-finder__skel-lines">
                    <div className="landing-blog-finder__skel landing-blog-finder__skel-line" />
                    <div className="landing-blog-finder__skel landing-blog-finder__skel-line landing-blog-finder__skel-line--short" />
                  </div>
                </div>
              ) : null}
              {anim.skel3 ? (
                <div className="landing-blog-finder__skeleton-row">
                  <div className="landing-blog-finder__skel landing-blog-finder__skel-circle" />
                  <div className="landing-blog-finder__skel-lines">
                    <div className="landing-blog-finder__skel landing-blog-finder__skel-line" />
                    <div className="landing-blog-finder__skel landing-blog-finder__skel-line landing-blog-finder__skel-line--short" />
                  </div>
                </div>
              ) : null}

              {anim.art1 ? (
                <div
                  className={`landing-blog-finder__article ${anim.art1Visible ? "landing-blog-finder__article--visible" : ""}`}
                >
                  <div className="landing-blog-finder__article-favicon" style={{ background: "#e8401a" }}>
                    R
                  </div>
                  <div className="landing-blog-finder__article-body">
                    <div className="landing-blog-finder__article-source">{t("art1Source")}</div>
                    <div className="landing-blog-finder__article-title">{t("art1Title")}</div>
                    <div className="landing-blog-finder__article-meta">{t("art1Meta")}</div>
                  </div>
                  <span className="landing-blog-finder__relevance-tag landing-blog-finder__relevance-tag--high">
                    {t("art1Match")}
                  </span>
                </div>
              ) : null}

              {anim.div1 ? (
                <div
                  className={`landing-blog-finder__article-divider ${anim.art1Visible ? "landing-blog-finder__article-divider--visible" : ""}`}
                  aria-hidden
                />
              ) : null}

              {anim.art2 ? (
                <div
                  className={`landing-blog-finder__article ${anim.art2Visible ? "landing-blog-finder__article--visible" : ""}`}
                >
                  <div className="landing-blog-finder__article-favicon" style={{ background: "#2a6db8" }}>
                    C
                  </div>
                  <div className="landing-blog-finder__article-body">
                    <div className="landing-blog-finder__article-source">{t("art2Source")}</div>
                    <div className="landing-blog-finder__article-title">{t("art2Title")}</div>
                    <div className="landing-blog-finder__article-meta">{t("art2Meta")}</div>
                  </div>
                  <span className="landing-blog-finder__relevance-tag landing-blog-finder__relevance-tag--high">
                    {t("art2Match")}
                  </span>
                </div>
              ) : null}

              {anim.div2 ? (
                <div
                  className={`landing-blog-finder__article-divider ${anim.art2Visible ? "landing-blog-finder__article-divider--visible" : ""}`}
                  aria-hidden
                />
              ) : null}

              {anim.art3 ? (
                <div
                  className={`landing-blog-finder__article ${anim.art3Visible ? "landing-blog-finder__article--visible" : ""}`}
                >
                  <div className="landing-blog-finder__article-favicon" style={{ background: "#18a058" }}>
                    M
                  </div>
                  <div className="landing-blog-finder__article-body">
                    <div className="landing-blog-finder__article-source">{t("art3Source")}</div>
                    <div className="landing-blog-finder__article-title">{t("art3Title")}</div>
                    <div className="landing-blog-finder__article-meta">{t("art3Meta")}</div>
                  </div>
                  <span className="landing-blog-finder__relevance-tag landing-blog-finder__relevance-tag--medium">
                    {t("art3Match")}
                  </span>
                </div>
              ) : null}
            </div>

            <div className={`landing-blog-finder__ai-label ${anim.aiLabel ? "landing-blog-finder__ai-label--visible" : ""}`}>
              <div className="landing-blog-finder__ai-dot" aria-hidden />
              {t("aiLabel")}
            </div>
          </div>
        </div>

        <div className="landing-blog-finder__text-col">
          <span
            className={`landing-blog-finder__badge ${anim.badge ? "landing-blog-finder__badge--visible" : ""}`}
          >
            {t("tag")}
          </span>
          <h2
            id={titleId}
            className={`landing-blog-finder__headline ${anim.headline ? "landing-blog-finder__headline--visible" : ""}`}
          >
            {titleLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </h2>
          <p
            className={`landing-blog-finder__description ${anim.desc ? "landing-blog-finder__description--visible" : ""}`}
          >
            {t("body")}
          </p>
          <Link
            href="/marketing/pricing"
            className={`landing-blog-finder__learn-more ${anim.learnMore ? "landing-blog-finder__learn-more--visible" : ""}`}
          >
            {t("learnMore")}{" "}
            <span className="landing-blog-finder__learn-more-arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </Box>
  );
}
