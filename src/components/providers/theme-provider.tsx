"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Thème clair par défaut ; thème sombre disponible depuis le menu utilisateur. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
