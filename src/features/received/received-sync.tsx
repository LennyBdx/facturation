"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { syncReceivedAction } from "./actions";

/**
 * Relève les nouvelles factures auprès de la plateforme à l'ouverture de la page.
 * L'écriture passe par une Server Action : le rendu de la page reste en lecture seule.
 */
export function ReceivedSync() {
  const router = useRouter();
  const [added, setAdded] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    syncReceivedAction().then((r) => {
      if (r.ok && r.data && r.data.added > 0) {
        setAdded(r.data.added);
        router.refresh();
      }
    });
  }, [router]);

  if (added === 0) return null;
  const s = added > 1 ? "s" : "";
  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-info/25 bg-info-soft p-3 text-sm text-info"
    >
      {added} nouvelle{s} facture{s} reçue{s} depuis votre dernière visite.
    </p>
  );
}
