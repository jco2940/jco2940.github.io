import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "./components";
import { PROFILE, SITE_URL } from "../site.config";

const title = `${PROFILE.name} | 북한 인권·교육 연구`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description: PROFILE.summary,
  icons: { icon: "/favicon.svg" },
  // 한국어 사이트를 브라우저가 다시 번역해 소속·메뉴가 틀리게 보이는 일을 막는다
  other: { google: "notranslate" },
  openGraph: { title, description: PROFILE.summary, type: "website", locale: "ko_KR" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" translate="no">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
