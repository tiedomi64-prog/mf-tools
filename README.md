# MF CONTROL — Tableau de bord iPad

Nouvelle application indépendante créée en remplacement de MF Tools V3 sur le même dépôt GitHub Pages.

## Démarrage
- Site : https://tiedomi64-prog.github.io/mf-tools/
- Sur iPad : ouvrir dans Safari → Partager → **Sur l'écran d'accueil**.
- Le site est statique : \`index.html\`, \`style.css\`, \`app.js\`, \`manifest.json\`, \`sw.js\`.

## Fonctions de cette V1
- Accueil avec indicateurs calculés depuis les données locales.
- Agenda manuel, tâches avec dates et catégories, projets avec statuts, prospects avec étapes, challenges à compteur.
- Sept espaces configurables, raccourcis personnels, export/import JSON.
- Adaptation tablette / téléphone / ordinateur, cache de l'interface hors ligne.

## Confidentialité et limites
**Le dépôt et ses fichiers sont publics.** Aucune donnée personnelle n'est inscrite dans le code ou envoyée à GitHub.
Les données utilisateur sont enregistrées dans localStorage sous \`mf_control_v1\`. Elles ne sont **pas synchronisées** d'un appareil à l'autre, ni avec Google Agenda, ChatGPT ou le CRM. Sauvegarder régulièrement avec Réglages → Exporter JSON.
La conservation locale dépend du navigateur et peut être supprimée par Safari ou lors d'une réinitialisation. Safari et une web-app ajoutée à l'écran d'accueil peuvent avoir des stockages distincts.

Pour une synchronisation automatique future : utiliser une authentification et un service backend sécurisé ; **ne jamais publier de clés API privées ni de données clients dans le dépôt GitHub Pages**.

## Identité visuelle
Direction inspirée du BRAND-GUIDE MF Studio validé le 25 octobre 2026 : charbon, cuivre/ambre, lin, vert pin et typographies Barlow Condensed / Montserrat / IBM Plex Mono.
L'icône de tableau de bord est un repère de cadrage générique, **pas le monogramme MF officiel**.

## Historique
L'ancienne version de MF Tools reste récupérable par l'historique Git du dépôt. Les anciennes clés de stockage local de MF Tools ne sont ni importées ni effacées automatiquement.