import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/regle-50-30-20")({
  head: () => ({
    meta: [
      {
        title: "Règle 50/30/20 : le guide complet (avec exemples) — ClearBudget",
      },
      {
        name: "description",
        content:
          "Comment fonctionne la règle 50/30/20 : 50 % de tes revenus pour les besoins, 30 % pour les envies, 20 % pour l'épargne. Méthode, exemples chiffrés et conseils.",
      },
      {
        property: "og:title",
        content: "Règle 50/30/20 : le guide complet (avec exemples) — ClearBudget",
      },
      {
        property: "og:description",
        content:
          "50 % de besoins, 30 % d'envies, 20 % d'épargne : comprends et applique la règle 50/30/20 avec des exemples chiffrés.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://clear-budget-buddy-21.lovable.app/regle-50-30-20" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: "https://clear-budget-buddy-21.lovable.app/regle-50-30-20" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Règle 50/30/20 : le guide complet (avec exemples)",
          description:
            "Comment fonctionne la règle 50/30/20 : 50 % de tes revenus pour les besoins, 30 % pour les envies, 20 % pour l'épargne.",
          inLanguage: "fr",
          author: { "@type": "Organization", name: "ClearBudget" },
          publisher: { "@type": "Organization", name: "ClearBudget" },
          mainEntityOfPage: "https://clear-budget-buddy-21.lovable.app/regle-50-30-20",
        }),
      },
    ],
  }),
  component: GuidePage,
});

const EXAMPLE_INCOME = 2500;

function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-brand text-brand-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="size-4">
              <rect x="3" y="6" width="18" height="12" rx="2" />
              <path d="M3 10h18" />
            </svg>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ClearBudget</span>
        </Link>
        <Link
          to="/"
          className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-semibold text-brand-foreground"
        >
          Essayer l'app
        </Link>
      </header>

      <article className="kpanel space-y-8 rounded-2xl p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
            La règle 50/30/20 : le guide complet pour budgéter simplement
          </h1>
          <p className="mt-3 text-[15px] text-mute">
            La règle 50/30/20 est une méthode de budget qui divise ton revenu net mensuel en trois
            enveloppes : 50 % pour tes besoins essentiels, 30 % pour tes envies et 20 % pour
            l'épargne. Popularisée par l'économiste Elizabeth Warren dans le livre{" "}
            <em>All Your Worth</em> (2005), elle reste la façon la plus simple de savoir, chaque
            mois, si tes finances sont équilibrées.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Comment fonctionne la règle 50/30/20 ?</h2>
          <p className="text-[15px] leading-relaxed">
            Prends ton <strong>revenu net mensuel</strong> (ce qui arrive réellement sur ton compte,
            après impôts) et répartis-le :
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <SplitCard share="50 %" title="Besoins" tone="needs">
              Loyer, courses, électricité, gaz, transports, télécoms, assurances, remboursements de
              crédits.
            </SplitCard>
            <SplitCard share="30 %" title="Envies" tone="wants">
              Restaurants, sorties, abonnements de streaming, loisirs, voyages, achats plaisir.
            </SplitCard>
            <SplitCard share="20 %" title="Épargne" tone="savings">
              Livret A, PEA, compte-titres, assurance vie, épargne de précaution, remboursement
              anticipé de dettes.
            </SplitCard>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Un exemple avec 2 500 € par mois</h2>
          <p className="text-[15px] leading-relaxed">
            Avec un revenu net de {EXAMPLE_INCOME.toLocaleString("fr-FR")} € par mois, la règle
            50/30/20 donne :
          </p>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-[14px]">
              <thead className="bg-brand/10 text-left text-[12px] uppercase tracking-[0.12em] text-mute">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Enveloppe</th>
                  <th className="px-4 py-2.5 font-medium">Part</th>
                  <th className="px-4 py-2.5 text-right font-medium">Montant mensuel</th>
                </tr>
              </thead>
              <tbody className="knum">
                <tr className="border-t border-border">
                  <td className="px-4 py-2.5">Besoins</td>
                  <td className="px-4 py-2.5 text-mute">50 %</td>
                  <td className="px-4 py-2.5 text-right">1 250 €</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2.5">Envies</td>
                  <td className="px-4 py-2.5 text-mute">30 %</td>
                  <td className="px-4 py-2.5 text-right">750 €</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2.5">Épargne</td>
                  <td className="px-4 py-2.5 text-mute">20 %</td>
                  <td className="px-4 py-2.5 text-right">500 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[15px] leading-relaxed">
            Si tes dépenses essentielles dépassent 1 250 €, tu le vois immédiatement : soit tes
            charges fixes sont trop lourdes (loyer, crédit), soit il faut ajuster les parts
            temporairement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Appliquer la règle en 5 étapes</h2>
          <ol className="space-y-2.5 text-[15px] leading-relaxed">
            <li className="flex gap-3">
              <Step n={1} />
              <span>
                <strong>Calcule ton revenu net mensuel.</strong> Salaire après prélèvements à la
                source, plus les autres revenus réguliers (allocations, primes récurrentes,
                avantages comme les titres-restaurant ou le remboursement des transports).
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={2} />
              <span>
                <strong>Liste tes dépenses des trois derniers mois</strong> et classe-les en
                « besoin » ou « envie ». La frontière est simple : un besoin est indispensable
                pour vivre et travailler.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={3} />
              <span>
                <strong>Compare chaque enveloppe à sa cible.</strong> Besoins au-dessus de 50 % ?
                C'est le signal le plus courant — souvent un loyer trop élevé par rapport au
                revenu.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={4} />
              <span>
                <strong>Automatise l'épargne.</strong> Programme un virement de 20 % dès la
                réception du salaire : ce qui part en premier n'est jamais dépensé.
              </span>
            </li>
            <li className="flex gap-3">
              <Step n={5} />
              <span>
                <strong>Revois chaque mois.</strong> Un budget vit : une hausse de loyer ou un
                abonnement oublié se voit en quelques semaines si tu suis tes enveloppes
                régulièrement.
              </span>
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pourquoi cette méthode fonctionne</h2>
          <ul className="space-y-2 text-[15px] leading-relaxed">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Elle est simple.</strong> Trois catégories suffisent, là où un budget
                classique en compte une trentaine — c'est pourquoi on la tient dans le temps.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Elle ne culpabilise pas.</strong> 30 % d'envies sont prévus par la règle :
                sortir ou s'offrir quelque chose fait partie du plan, pas un écart.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Elle met l'épargne d'abord.</strong> 20 % avant les dépenses, pas avec ce
                qui reste en fin de mois.
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Adapter la règle à ta situation</h2>
          <p className="text-[15px] leading-relaxed">
            Le 50/30/20 est un point de départ, pas une loi. Dans les grandes villes où le loyer
            pèse lourd, beaucoup démarrent plutôt à <strong>60/20/20</strong> : 60 % de besoins, 20
            % d'envies, 20 % d'épargne. À l'inverse, si tes besoins sont déjà sous 45 %, tu peux
            pousser l'épargne à 25 ou 30 % pour accélérer un projet (apport immobilier, voyage,
            indépendance financière).
          </p>
          <p className="text-[15px] leading-relaxed">
            L'important est de conserver trois enveloppes claires et un objectif d'épargne fixe :
            c'est la structure du 50/30/20 qui fait la différence, pas les pourcentages exacts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Les pièges les plus courants</h2>
          <ul className="space-y-2 text-[15px] leading-relaxed">
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Compter le brut au lieu du net.</strong> La règle s'applique à ce que tu
                reçois réellement.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Classer les abonnements en besoins.</strong> Netflix ou la salle de sport
                sont des envies : honnête sur ce point, le budget devient fiable.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Oublier les dépenses annuelles.</strong> Assurance, impôts échelonnés,
                vacances : divise-les par 12 et intègre-les aux enveloppes.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <strong>Épargner ce qui reste.</strong> Si les 20 % attendent la fin du mois, ils
                ne restent presque jamais.
              </span>
            </li>
          </ul>
        </section>

        <section className="kpanel-diag space-y-3 rounded-xl p-5">
          <h2 className="text-lg font-semibold">Applique la règle avec ClearBudget</h2>
          <p className="text-[15px] leading-relaxed">
            ClearBudget applique la règle 50/30/20 automatiquement : tu saisis tes revenus, puis tes
            dépenses avec leurs sous-catégories, et l'app calcule tes enveloppes, compare le prévu
            au réel et suit ton évolution mois par mois. Gratuit, en français ou en anglais.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-[14px] font-semibold text-brand-foreground"
          >
            Créer mon budget 50/30/20
          </Link>
        </section>
      </article>

      <footer className="mt-6 pb-4 text-center text-[13px] text-mute">
        <Link to="/" className="underline-offset-4 hover:underline">
          ← Retour à ClearBudget
        </Link>
      </footer>
    </div>
  );
}

function SplitCard({
  share,
  title,
  tone,
  children,
}: {
  share: string;
  title: string;
  tone: "needs" | "wants" | "savings";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "needs"
      ? "text-emerald-300"
      : tone === "wants"
        ? "text-amber-300"
        : "text-sky-300";
  return (
    <div className="rounded-xl border border-border p-4">
      <p className={`knum text-xl font-bold ${toneClass}`}>{share}</p>
      <p className="mt-0.5 text-[14px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{children}</p>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="knum mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-[12px] font-bold text-brand">
      {n}
    </span>
  );
}
