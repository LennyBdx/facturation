# Domaine BTP : règles de calcul et facture électronique

Toutes les règles ci-dessous sont implémentées en fonctions pures dans `src/domain/` et couvertes par les tests Vitest (`pnpm test`).

> Les choix marqués **[à valider]** sont des hypothèses raisonnables, mais il faut les faire confirmer par un expert-comptable avant la mise en production.

## 1. Montants et arrondis — `money.ts`

- Les montants sont stockés en chaîne décimale à 2 décimales (`"1250.00"`) et calculés avec `decimal.js`. Il n'y a jamais de `number` dans un calcul.
- Les montants sont **arrondis au centime, demi supérieur** (`ROUND_HALF_UP` : 0,005 → 0,01).
- **Ligne** : quantité × prix unitaire HT, arrondi au centime. Le montant de chaque ligne est arrondi avant toute somme.
- **TVA** : elle est calculée **par taux**, sur la somme des bases HT du taux, puis arrondie (règle EN 16931 BR-CO-17). Elle n'est pas calculée ligne par ligne.
- **Répartition** : une remise ou une déduction globale est répartie entre les taux de TVA au prorata des bases, par la méthode du plus fort reste (`allocate`). La somme des parts est donc toujours exacte au centime.

## 2. Devis — `quote.ts`

- Un devis est organisé en lots, et chaque lot contient des lignes. Chaque lot a son sous-total HT.
- **Remise globale** :
  - en % ou en montant HT ;
  - plafonnée au total ;
  - répartie entre les taux de TVA.
- **Acompte demandé** : un % du TTC, affiché sur le devis.
- **Autoliquidation** : toutes les lignes passent en catégorie de TVA `AE` à 0 %. La mention de l'article 283-2 nonies du CGI est ajoutée.
- **Taux réduits** : 10 % ou 5,5 % pour des travaux dans un logement de plus de 2 ans. Il faut une attestation du client (art. 279-0 bis du CGI) ; une mention est ajoutée automatiquement pour un particulier.

## 3. Situations de travaux — `progress-billing.ts`

**Principe : tout est calculé en cumul depuis le début du marché, puis la période s'obtient par différence avec la situation précédente.** Ainsi, les arrondis ne s'accumulent pas : à 100 %, le total facturé égale exactement le marché (test « arrondis cumulés »).

Pour chaque situation n :

1. **Travaux cumulés HT par ligne** = montant HT de la ligne du marché × % d'avancement cumulé (arrondi).
2. **Remise cumulée** = remise du marché × (travaux cumulés ÷ marché avant remise).
3. **Déduction d'acompte cumulée** = acompte HT × (travaux nets cumulés ÷ marché HT), plafonnée à l'acompte. **[à valider]** L'acompte est donc récupéré au prorata de l'avancement. D'autres pratiques existent : déduction intégrale sur la première situation, ou remboursement à partir d'un seuil (marchés publics).
4. **Bases HT cumulées par taux** = travaux − remise − acompte, répartis par taux. La **base de la période** = base cumulée − base cumulée précédente.
5. **TVA de la période** = base de la période × taux, arrondie, pour chaque taux.
6. **Retenue de garantie cumulée** = taux × travaux **TTC** cumulés, hors déduction d'acompte. La retenue de la période s'obtient par différence. **[à valider]** La pratique courante calcule la retenue sur le TTC ; en autoliquidation, TTC = HT.
7. **Net à payer** = TTC de la période − retenue de la période.

**Règles de saisie**

- L'avancement cumulé d'une ligne ne peut pas diminuer : une baisse se corrige par un avoir.
- La valeur doit être comprise entre 0 et 100 %.

Un instantané `ProgressCumulative` est enregistré avec chaque situation et sert de « précédent » à la suivante.

**Facture de solde** : c'est la dernière situation, quand toutes les lignes sont à 100 %. L'acompte est alors entièrement récupéré.

**Exemple testé** (marché 15 000 € HT, TVA 20 %, acompte 30 %, retenue 5 %) :

| | Acompte | Situation 1 | Situation 2 | Situation 3 (100 %) |
|---|---|---|---|---|
| Travaux de la période HT | — | 3 000,00 | 5 500,00 | 6 500,00 |
| Acompte déduit HT | — | 900,00 | 1 650,00 | 1 950,00 |
| TTC | 5 400,00 | 2 520,00 | 4 620,00 | 5 460,00 |
| Retenue de garantie | — | 180,00 | 330,00 | 390,00 |
| Net à payer | 5 400,00 | 2 340,00 | 4 290,00 | 5 070,00 |

Contrôles :
- 5 400 + 2 520 + 4 620 + 5 460 = **18 000 € TTC**, c'est-à-dire le marché TTC.
- 180 + 330 + 390 = **900 €**, c'est-à-dire 5 % du TTC.

## 4. Facture d'acompte

- Elle facture un % du marché HT (après remise), ventilé par taux de TVA.
- Les travaux immobiliers sont des prestations de services : la TVA est exigible à l'encaissement, donc la facture d'acompte porte sa TVA.
- La déduction se fait ensuite en HT dans les situations (§ 3), ce qui évite de facturer deux fois la TVA.

## 5. Retenue de garantie

- Base légale : loi n° 71-584 du 16 juillet 1971.
- Elle est de **5 % maximum** ; le contrôle est fait par `isValidRetentionRate`.
- Elle est retenue sur chaque paiement et restituée **un an après la réception des travaux**, sauf réserves.
- Une **caution bancaire** peut la remplacer (option sur le chantier) : le taux appliqué est alors de 0 %.
- Le tableau de bord signale les retenues libérables, c'est-à-dire celles dont la date de réception + 1 an est dépassée.
- Il n'y a **pas de retenue par défaut pour un particulier** : c'est un choix du produit, modifiable sur le chantier.

## 6. Autoliquidation en sous-traitance

- Base légale : art. 283-2 nonies du CGI. Le sous-traitant facture **hors TVA** et l'entreprise principale autoliquide la TVA.
- Sur les factures et devis :
  - catégorie de TVA EN 16931 `AE` ;
  - taux 0 % ;
  - mention « Autoliquidation : TVA due par le preneur assujetti, article 283-2 nonies du CGI. » ;
  - **numéro de TVA de l'acheteur obligatoire** (contrôlé avant émission).
- Pour une facture **reçue** en autoliquidation, l'interface rappelle à l'utilisateur qu'il doit autoliquider la TVA.

## 7. Numérotation — `numbering.ts`

- Base légale : art. 242 nonies A, annexe II du CGI. Le numéro est unique, chronologique et continu.
- Format `{préfixe}-{année}-{compteur}`, par exemple `FA-2026-0042`. Le compteur ne repart pas à zéro chaque année.
- **Le numéro est attribué à l'émission**, jamais au brouillon : supprimer un brouillon ne crée aucun trou.
- Les **avoirs** ont une série distincte (`AV`), elle aussi continue.
- Dans les paramètres, le prochain numéro doit valoir « dernier numéro émis + 1 » (`validateNextValue`). Le préfixe est figé dès qu'un document a été émis.
- Côté base de données, `takeNextNumber` devra être atomique (`UPDATE … RETURNING` dans la transaction d'émission).

## 8. Contrôle de conformité avant émission — `compliance.ts`

Ce contrôle est **bloquant**. Chaque anomalie indique où la corriger : paramètres de l'entreprise, fiche client ou brouillon.

| Partie | Contrôles |
|---|---|
| Vendeur | <ul><li>Raison sociale</li><li>SIREN et SIRET (clé de Luhn)</li><li>TVA (clé cohérente avec le SIREN)</li><li>Adresse et code postal</li><li>Forme juridique</li><li>Immatriculation RCS ou RM</li><li>**Assurance décennale** : assureur, contrat, couverture (art. L243-2 du Code des assurances)</li></ul> |
| Acheteur | <ul><li>Nom et adresse de facturation</li><li>**SIREN obligatoire pour un professionnel** (facture électronique)</li><li>TVA obligatoire en autoliquidation</li><li>Code service conseillé pour un acheteur public (non bloquant)</li></ul> |
| Facture | <ul><li>Date d'émission et échéance (l'échéance doit suivre l'émission)</li><li>Conditions de paiement</li><li>Taux des pénalités</li><li>Indemnité forfaitaire de 40 € pour un client professionnel</li><li>**Catégorie de l'opération** (nouvelle mention de la réforme)</li><li>Lignes complètes</li><li>Cohérence entre TVA et catégorie (AE à 0 %, S ≠ 0 %)</li><li>Avoir : facture d'origine</li><li>Acheteur public : référence d'engagement conseillée</li></ul> |

**Identifiants** (`identifiers.ts`) :
- **SIREN** : 9 chiffres et clé de Luhn.
- **SIRET** : 14 chiffres, clé de Luhn, et il doit commencer par le SIREN. Exception La Poste : si la clé de Luhn échoue, la somme des chiffres doit être un multiple de 5.
- **TVA française** : `FR` + clé + SIREN, avec clé = (12 + 3 × (SIREN mod 97)) mod 97.
- **Code APE** : 4 chiffres et une lettre.

## 9. Statuts du cycle de vie de la facture électronique — `lifecycle.ts`

| Code | Statut | Émis par | Obligatoire |
|---|---|---|---|
| 200 | Déposée | Plateforme de l'émetteur | **Oui** |
| 201 | Émise par la plateforme | Plateforme | |
| 202 | Reçue par la plateforme | Plateforme du destinataire | |
| 203 | Mise à disposition | Plateforme du destinataire | |
| 204 | Prise en charge | Destinataire | |
| 205 | Approuvée | Destinataire | |
| 206 | Approuvée partiellement | Destinataire | |
| 207 | En litige | Destinataire | |
| 208 | Suspendue | Destinataire | |
| 209 | Complétée | Émetteur | |
| 210 | Refusée | Destinataire | **Oui** |
| 211 | Paiement transmis | Destinataire | |
| 212 | Encaissée | Émetteur | **Oui** si la TVA est exigible à l'encaissement : c'est le cas des travaux du BTP |
| 213 | Rejetée | Plateforme (contrôles techniques) | **Oui** |

Le code 214 « Visée » existe aussi (validation par un mandataire). Il n'est pas utilisé dans le prototype.

**Distinction importante**

- **Rejetée (213)** : refus technique de la plateforme. La facture n'existe pas fiscalement ; on la corrige et on la **redépose**. Le prototype conserve le même numéro. **[à valider]** Ce point est à confirmer avec la plateforme agréée choisie.
- **Refusée (210)** : refus commercial du client. La facture existe fiscalement ; on l'annule par un **avoir**, puis on émet une nouvelle facture.

**Encaissée (212)** est déclarée automatiquement quand un paiement solde la facture (`recordPayment` → `provider.reportPayment`).

**Particuliers (B2C)**

- Ils ne sont pas concernés par la facture électronique : la transmission des données se fait par **e-reporting**.
- Leurs factures sont émises sans dépôt sur la plateforme et affichent le badge « E-reporting ».

**Deux dimensions de statut**

Le **statut de paiement** n'est jamais stocké. Il est recalculé à partir des paiements, de l'échéance et de la date du jour :
- brouillon ;
- émise ;
- payée partiellement ;
- payée ;
- en retard ;
- annulée par avoir.

Le **statut du cycle de vie** est celui transmis par la plateforme.

### Sources

- DGFiP, *Spécifications externes et normes pour la facturation électronique* (version 3.1 du 31/10/2025 et annexes, dont le format sémantique du cycle de vie) : https://www.impots.gouv.fr/specifications-externes-b2b
- Norme AFNOR XP Z12-012 (formats, profils et statuts), publiée par impots.gouv.fr : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/specification_externes_b2b/afnor/norme-afnor-factures.pdf
- DGFiP, *Guide pratique de démarrage au 1er septembre 2026* : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf
- DGFiP, fiche « L'émission de factures électroniques » : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-e-invoicing.pdf
- Liste des plateformes agréées : https://www.impots.gouv.fr/je-consulte-la-liste-des-plateformes-agreees
- Synthèses consultées pour recouper la liste des codes 200 à 214 :
  - Quadient : https://www.quadient.com/fr/blog/cycle-vie-facture-electronique-statuts
  - ma-facture-electronique.org : https://ma-facture-electronique.org/facture-electronique-definition/statuts-cycle-de-vie/

À faire avant la production : vérifier chaque libellé et chaque code contre l'annexe « cycle de vie » de la dernière version des spécifications externes.

## 10. Points ouverts

1. **Méthode de récupération de l'acompte** (prorata, intégrale ou seuil) : à paramétrer par chantier.
2. **Base de la retenue de garantie** (TTC ou HT hors autoliquidation) : à confirmer.
3. **Représentation Factur-X d'une situation.** Aujourd'hui, une ligne porte la quantité et le prix du marché, avec un montant net égal au montant de la période. Pour respecter BR-LIN-04, il faudra soit une quantité « de période », soit des remises de ligne. L'acompte et la remise seront des remises de niveau document (BG-20).
4. **Numéro d'une facture rejetée puis redéposée** : même numéro ou nouveau numéro, selon la doctrine de la plateforme choisie.
5. **Avoir partiel** : seul l'avoir total est prévu dans le prototype.
