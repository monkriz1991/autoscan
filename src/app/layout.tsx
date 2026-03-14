import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/global.scss";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import RootLayoutContent from "../components/ui/RootLayoutContent";

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
          <RootLayoutContent>{children}</RootLayoutContent>
        </MantineProvider>
      </body>
    </html>
  );
}
