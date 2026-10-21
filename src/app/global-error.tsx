"use client";

import "./globals.css";

/**
 * Dernier filet de sécurité : remplace la mise en page racine si elle plante.
 * Doit définir ses propres <html> et <body>.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="flex min-h-dvh items-center justify-center bg-background p-6 font-sans text-foreground">
        <div role="alert" className="max-w-md space-y-4 rounded-lg border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">L&apos;application a rencontré un problème</h1>
          <p className="text-muted-foreground">Rechargez la page. Si le problème persiste, contactez le support.</p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
