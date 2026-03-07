import { Container, Text } from "@mantine/core";

export default function Footer() {
  return (
    <footer className="footer">
      <Container size="lg">
        <Text size="sm" c="dimmed" ta="center">
          © {new Date().getFullYear()} My App
        </Text>
      </Container>
    </footer>
  );
}
