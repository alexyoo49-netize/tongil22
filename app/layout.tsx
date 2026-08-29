import type { Metadata } from 'next';

import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '통일 대표팀 메이커 | 세계 7강 전술 도전',
  description: '남북한 선수를 조합해 전술과 경기 결과를 바꾸는 축구 대표팀 게임',
  openGraph: {
    title: '통일 대표팀 메이커',
    description: '7개 축구 강호의 스타일을 분석하고, 맞춤 XI와 전술로 승률을 높이세요.',
    type: 'website',
    images: [{ url: new URL('/og.png', siteUrl).toString(), width: 1200, height: 630, alt: '통일 대표팀 메이커' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '통일 대표팀 메이커',
    description: '7개 강호에 맞설 단 하나의 XI를 완성하세요.',
    images: [new URL('/og.png', siteUrl).toString()],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
