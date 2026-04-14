"use client";

import type { ReactNode } from "react";
import { Box } from "@mantine/core";

type Props = {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
};

/** Общая оболочка страниц входа/регистрации в стиле маркетинговых страниц (лендинг). */
export default function AuthPageShell({ title, subtitle, footer, children }: Props) {
  return (
    <div className="marketing-page auth-page">
      <header className="marketing-page__hero auth-page__hero">
        <h1 className="marketing-page__hero-title auth-page__title">{title}</h1>
        {subtitle ? (
          <p className="marketing-page__hero-sub auth-page__subtitle">{subtitle}</p>
        ) : null}
      </header>
      <Box className="auth-page__card-wrap">{children}</Box>
      {footer ? <div className="auth-page__footer">{footer}</div> : null}
    </div>
  );
}
