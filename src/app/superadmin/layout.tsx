"use client";

import React from "react";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h2 style={styles.logo}>Superadmin</h2>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.content}>{children}</div>
      </main>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} Superadmin Panel
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f8f9fa",
  },
  header: {
    height: 64,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e9ecef",
    display: "flex",
    alignItems: "center",
  },
  headerInner: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 24px",
  },
  logo: {
    margin: 0,
    fontWeight: 600,
    fontSize: 20,
  },
  main: {
    flex: 1,
    padding: "40px 20px",
  },
  content: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  footer: {
    height: 60,
    borderTop: "1px solid #e9ecef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#868e96",
    backgroundColor: "#ffffff",
  },
};
