import { SiteNav } from "@/components/marketing/site-nav";
import { Footer } from "@/components/marketing/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="container max-w-3xl py-16">
        <article className="prose prose-neutral max-w-none">{children}</article>
      </main>
      <Footer />
    </>
  );
}
