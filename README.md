# MF Studio — écran iPad paysage

Tableau de bord **mono-écran**, sans menu et sans interaction à l'écran. Il remplace l'ancien MF Tools sur la même adresse GitHub Pages :
https://tiedomi64-prog.github.io/mf-tools/

## Éléments en direct
- Horloge et date : fuseau Europe/Paris, mises à jour toutes les secondes.
- Météo de Saint-Justin (Landes, 40240) : API Open-Meteo, ~43.9816, -0.2300, température actuelle et températures max/min du jour, relecture toutes les 15 minutes (et au retour sur l'onglet). Météo mise en cache hors connexion. Il s'agit de données météo **actualisées régulièrement**, pas d'une mesure en continu.
- Agenda, challenge poker, R1/R2 et priorités : lecture du fichier \`dashboard.json\` toutes les 5 minutes (et lorsque l'iPad reprend le focus).

## Transmission du directeur des opérations
Les contenus opérationnels sont centralisés dans un **seul fichier** : \`dashboard.json\`. L'application le lit et l'affiche automatiquement après publication sur GitHub Pages.

### Contrat JSON
\`\`\`json
{
  "schema": "mf-screen/v1",
  "updatedAt": "2026-11-15T17:00:00+01:00",
  "agenda": {
    "date": "2026-11-15",
    "items": [
      {"time": "09:00", "title": "Exemple de rendez-vous"}
    ]
  },
  "poker": {
    "goal_eur": 3000,
    "current_eur": 1240,
    "hours_done": 22,
    "hours_goal": 50,
    "days_done": 12,
    "days_goal": 20
  },
  "commercial": {
    "period": "novembre 2026",
    "r1": 14,
    "r2": 5,
    "objective_r1": 20
  },
  "priorities": ["Exemple de priorité 1", "Exemple de priorité 2"]
}
\`\`\`

**Ces chiffres sont des exemples de format UNIQUEMENT :** la version déployée est volontairement vide, pour ne pas inventer de valeurs personnelles. L'agenda ne montre que les rendez-vous portant la **date du jour en Europe/Paris** : une date antérieure est présentée comme « mise à jour en attente ».

### Processus futur
Le directeur des opérations peut préparer les valeurs JSON et les transmettre dans la conversation où l'agent est autorisé à modifier GitHub. Sur instruction explicite, l'assistant remplace \`dashboard.json\` ; le panneau récupère les modifications lors de sa prochaine actualisation. Aucune mise à jour récurrente ou autonome n'est activée par la publication de ce code.

## Confidentialité importante
**Le dépôt GitHub est public : \`dashboard.json\` sera public lui aussi.** Ne publiez pas dans ce fichier d'informations privées (noms de clients, adresses, rendez-vous personnels, résultats confidentiels, etc.) sans avoir décidé consciemment de les rendre publics. Pour alimenter le tableau avec des données privées, il faudra un système de données authentifié, distinct de GitHub Pages.

## Technique
- Fichiers : \`index.html\`, \`style.css\`, \`app.js\`, \`dashboard.json\`, \`manifest.json\`, \`sw.js\`, \`icon.svg\`.
- Style inspiré du guide MF Studio (charbon, cuivre, lin, vert pin, Barlow Condensed, Montserrat, IBM Plex Mono). Le petit « MF » est typographique : **ce n'est pas le logo vectoriel officiel**.
- Sur iPad : Safari → Partager → Sur l'écran d'accueil. L'affichage est conçu pour le paysage (1024×768 et autres écrans).
- Mode hors ligne partiel : dernière météo et dernier fichier de données valides sauvegardés sur l'appareil.
