import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisionCCTV — AI-Powered CCTV Analysis Tool",
  description:
    "AI-powered forensic video analysis: locate critical moments from CCTV footage using face recognition and natural-language keyword search.",
  keywords: ["CCTV", "AI", "face recognition", "video analysis", "forensic", "investigation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
