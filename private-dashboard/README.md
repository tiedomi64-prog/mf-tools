# MF Studio — écran iPad privé

Statut : CODE PRÉPARÉ — NON DÉPLOYÉ. Aucun secret ni aucune donnée personnelle n'est ajouté au dépôt public.

## Ce qui est prêt

Ce nouveau Worker protège un écran situé sur une AUTRE adresse que le GitHub Pages public :
https://tiedomi64-prog.github.io/mf-tools/ reste inchangé.

Il réutilise le design existant et fournit son propre app.js sans cache des données privées.
L'agenda, le poker, les R1/R2 et les priorités proviennent de Cloudflare KV, accessible
uniquement après authentification. L'écran se rafraîchit toutes les 5 minutes.
L'horloge et la météo fonctionnent comme sur le site actuel.

## Sécurité

- Appairage de l'iPad avec un long code aléatoire : une seule fois à l'installation.
- Cookie Secure / HttpOnly / SameSite=Strict renouvelé sur les consultations.
- Jeton WRITE_TOKEN distinct, uniquement côté serveur.
- Aucune donnée sensible ne transite par dashboard.json du GitHub public.
- Pas de service worker ni de stockage local de données privées dans la version iPad.
- Si les cookies sont effacés, il faut exceptionnellement refaire l'appairage.
- En cas de perte ou vol de l'iPad, révoquer toutes les sessions en remplaçant le
  namespace KV lié, puis reconnecter le nouvel appareil.

## Sources de vérité

Le classeur privé MF STUDIO — Flux privé iPad comporte l'onglet ENTREES.

Colonnes : A=cle ; B=valeur ; C=statut ; D=mis_a_jour ; E=source.
Statuts acceptés : valide / confirme / simulation / inconnu.
La donnée test 200 parties est SIMULATION, pas un vrai volume.
Le Worker lit les clés poker.goal_games, poker.current_games, poker.start_date,
poker.end_date, commercial.objective_r1, priorities.1, priorities.2, priorities.3.

Le CRM existant fournit les R1/R2 consignés et Google Calendar fournit les rendez-vous.
Un R1/R2 non consigné n'est pas inventé. Une absence de valeur reste inconnue (null).

## Installation unique — dans le compte Cloudflare du propriétaire

Prérequis : compte Cloudflare, Node.js 20+, Google Cloud avec API Calendar et API Sheets
activées. Ne jamais publier ou transmettre les secrets dans ChatGPT/GitHub.

1. Depuis le dossier private-dashboard :

    npm install
    npx wrangler login
    npx wrangler kv namespace create STORE

2. Remplacer REMPLACER_PAR_ID_NAMESPACE_KV dans wrangler.toml par l'ID retourné.

3. Créer DEUX secrets différents et aléatoires de 32 octets minimum.
   Exemple : openssl rand -hex 32 (à exécuter deux fois).
   Les définir séparément via :
   
    npx wrangler secret put PAIRING_CODE
    npx wrangler secret put WRITE_TOKEN

4. Créer un compte de service Google Cloud dédié, en lecture seule. Activer les API
   Google Calendar et Google Sheets. Partager en LECTEUR avec son adresse e-mail :
   - le classeur privé MF STUDIO — Flux privé iPad ;
   - le classeur CRM Prospection — Matthieu Fonta Vidéaste ;
   - les calendriers à afficher (depuis le partage Google Calendar).

   Créer une clé JSON du compte de service localement ; ne JAMAIS l'ajouter au dépôt.
   La stocker comme secret Cloudflare :

    npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON

   Si les règles du compte interdisent les clés de service, choisir une solution OAuth
   autorisée à la place. Ne pas contourner ces règles.

5. Ajouter la configuration des sources sous forme de secrets :

    npx wrangler secret put SOURCE_SHEET_ID
    npx wrangler secret put CRM_SHEET_ID
    npx wrangler secret put CALENDAR_IDS

   SOURCE_SHEET_ID = ID de la feuille privée créée. CRM_SHEET_ID = ID du CRM.
   CALENDAR_IDS = IDs Google Calendar réellement partagés, séparés par des virgules.

6. Déployer :

    npx wrangler deploy

   Cloudflare communiquera l'URL réelle en workers.dev ; elle n'existe pas avant.

7. Ouvrir cette URL sur Safari de l'iPad et saisir UNE FOIS le code d'activation.
   Vérifier chargement, fermeture/veille et mise à jour automatique.
   Pour recharger les sources immédiatement, appeler POST /api/sync avec WRITE_TOKEN.
   Sinon le Cron du Worker passe toutes les 15 minutes (UTC).

## Tests avant d'en faire l'écran principal

- Navigateur anonyme : impossible de lire /dashboard.json.
- Appairage correct : écran MF Studio identique à l'actuel.
- Objectif 3 000 parties, 200 test et mention TEST, non confondus avec un vrai résultat.
- Calendrier privé visible seulement après autorisation Google du compte de service.
- Nombres R1/R2 fondés sur le CRM ; inconnu != zéro.
- Après modification de ENTREES : Cron 15 min et écran 5 min maximum supplémentaires.
- Sur Wi-Fi coupé : pas d'ancienne copie des données métier dans le navigateur.
- Compatibilité Safari de l'ancien iPad testée AVANT bascule définitive.
- Adresse GitHub Pages publique intacte et sans données confidentielles.

## Retour arrière

Ne pas modifier les fichiers du site public. Si besoin, désactiver uniquement
le Worker Cloudflare et réouvrir le GitHub Pages existant.

## Limitation réelle

Aucun compte Cloudflare ni accès Google Cloud n'est connecté à cet agent.
Sans le provisioning unique du compte, du namespace KV, des secrets et des partages
autorisés, le Worker n'est PAS encore déployé. Une fois en service, l'iPad reste passif.
