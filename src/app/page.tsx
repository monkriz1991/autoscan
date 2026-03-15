import Link from "next/link";
import { Box, Stack, Title, Text, List, Button } from "@mantine/core";

const SLOGAN = "Умная диагностика. Один вход."

const TECH_SPECS = [
  "Tauri + Next.js — кроссплатформа (Windows, macOS)",
  "OBD-II — режим только чтение, SAE J1979",
  "ELM327 — USB и Bluetooth",
  "VAG full-scan — K-line (KWP1281/KWP2000)",
  "Live data — real-time через WebSocket",
  "AI-диагностика ошибок",
  "Режим симуляции — без адаптера",
  "OAuth2 — вход в аккаунт",
];

function CarSilhouetteBar() {
  return (
    <Box
      style={{
        background: "#0d0d0f",
        minHeight: 120,
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        marginTop: "-40px",
        marginBottom: 24,
      }}
    >
      <Box
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          padding: "32px 20px",
        }}
      >
        <svg
          viewBox="0 0 200 60"
          style={{ width: 160, height: 48, flexShrink: 0 }}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 40 L15 35 L25 35 L35 30 L55 30 L70 25 L95 25 L105 28 L130 28 L145 33 L155 38 L155 42 L150 45 L145 47 L5 47 L2 44 Z" />
          <circle cx="45" cy="47" r="6" fill="rgba(255,255,255,0.4)" stroke="none" />
          <circle cx="115" cy="47" r="6" fill="rgba(255,255,255,0.4)" stroke="none" />
        </svg>
        <Text
          component="p"
          style={{
            fontSize: "clamp(1.125rem, 2vw, 1.5rem)",
            fontWeight: 300,
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {SLOGAN}
        </Text>
      </Box>
    </Box>
  );
}

export default function HomePage() {
  return (
    <Stack gap="xl">
      <CarSilhouetteBar />

      <Box>
        <Title order={6} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.15em", marginBottom: 16 }}>
          Технические характеристики
        </Title>
        <List
          spacing="sm"
          size="sm"
          c="dimmed"
          icon={
            <Box
              w={6}
              h={6}
              style={{ borderRadius: "50%", background: "#228be6", flexShrink: 0 }}
            />
          }
        >
          {TECH_SPECS.map((item, i) => (
            <List.Item key={i}>{item}</List.Item>
          ))}
        </List>
      </Box>

      <Box style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button component={Link} href="/login" variant="filled" size="md">
          Войти
        </Button>
        <Button component={Link} href="/pricing" variant="light" size="md">
          Тарифы
        </Button>
      </Box>
    </Stack>
  );
}
