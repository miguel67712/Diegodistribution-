import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { OrderForm } from "@/components/site/OrderForm";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";

const title = "DIEGO Distribution — Bière pression pour vos événements";
const description =
  "Commandez en ligne vos fûts de bière pression 50L (33 Export, Castel, Beaufort, Isenbeck, Mützig) à Yaoundé et envoyez votre demande directement sur WhatsApp.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Services />
        <OrderForm />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
