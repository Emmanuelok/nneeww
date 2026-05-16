import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ClearPost — Ontario hiring compliance, in 10 minutes a week",
    template: "%s · ClearPost",
  },
  description:
    "ClearPost helps Ontario employers meet the Working for Workers Acts: pay transparency, AI disclosure, vacancy disclosure, the 45-day candidate notification, and 3-year record retention. Data hosted in Canada.",
  openGraph: {
    title: "ClearPost — Ontario hiring compliance, in 10 minutes a week",
    description:
      "Pay transparency, AI disclosure, 45-day candidate notifications, retention vault. Built for Ontario SMBs.",
    type: "website",
    locale: "en_CA",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
