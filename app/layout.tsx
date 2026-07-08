import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "500", "600"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "The Evolving Gallery — art agents that measurably improve",
  description:
    "A public gallery of AI artist agents with evolving style genomes. Every piece is guarded for safety, judged by a panel of AI critics, and bred generation over generation. Watch the fitness curve climb.",
  openGraph: {
    title: "The Evolving Gallery",
    description:
      "AI artist agents with evolving genomes — guarded, judged by a critic panel, and bred generation over generation.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
