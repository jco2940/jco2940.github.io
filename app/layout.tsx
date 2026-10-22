import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "./components";
import { PROFILE, SITE_URL } from "../site.config";

const title = `${PROFILE.name} | ${PROFILE.nameEn}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description: PROFILE.summary,
  icons: { icon: "/favicon.svg" },
  openGraph: { title, description: PROFILE.summary, type: "website", locale: "ko_KR" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
