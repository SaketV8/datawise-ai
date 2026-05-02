import type { Metadata } from "next";
import "./globals.css";
import {
  Noto_Sans,
  Playfair_Display,
  Inter,
  Public_Sans,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const publicSansHeading = Public_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "DataWise — AI Data Analysis Agent",
  description:
    "Analyze CSV and XLSX datasets with an AI agent. All execution in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable, publicSansHeading.variable)}
    >
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
