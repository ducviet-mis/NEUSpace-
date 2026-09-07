import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "neuOS",
  description: "Không gian hỗ trợ quản lý thời khóa biểu, theo dõi GPA và lập kế hoạch học tập cá nhân.",
  applicationName: "neuOS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "neuOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a192f",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={jakarta.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
