import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/global.scss";

import { MantineProvider, Container } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/ui/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <MantineProvider defaultColorScheme="light">
          <Notifications position="top-right" />
          <div className="layout">
            <Navbar />
            <main className="layout__main">
              <Container size="lg">{children}</Container>
            </main>
            <Footer />
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
