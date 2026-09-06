import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Tiện Ích Sinh Viên NEU",
  description: "Quản lý thời khóa biểu, theo dõi GPA và lập kế hoạch học tập dành cho sinh viên ĐH Kinh tế Quốc dân.",
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
