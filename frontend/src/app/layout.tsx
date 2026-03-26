import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptiThru",
  description: "Beauty e-commerce profitability via Theory of Constraints",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
