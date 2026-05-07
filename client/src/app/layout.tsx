import type { Metadata } from "next";
import "./globals.css";
import { Inter, Public_Sans } from "next/font/google";
// import {
//   Noto_Sans,
//   Playfair_Display,
//   Inter,
//   Public_Sans,
// } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const publicSansHeading = Public_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DataWise | AI Data Analysis Agent",
  description:
    "Analyze CSV and XLSX datasets with an AI agent. All execution in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // className={cn("font-sans", inter.variable, publicSansHeading.variable)}
  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable, publicSansHeading.variable)}
    >
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
