# MF Tools V3 — L’atelier

Une application personnelle pour prospecter, chiffrer, préparer les tournages,
suivre les interviews et les Media Days, planifier les publications et consulter
une formation vidéo. Application statique, sans serveur ni compte.

## Nouveautés V3

- Formation : chapitres et sous-sujets, recherche sans accents, favoris, suivi de
  lecture, notes personnelles et liens transversaux du mindmap.
- Réutilisation d’une sélection dans la préparation, la shotlist, le matériel,
  la livraison, les notes d’un prospect ou les questions d’une interview.
- Cinq méthodes à ajouter aux projets : appel client, film + huit Reels,
  montage, immobilier et préparation de Media Day. Les ajouts évitent les
  doublons et conservent les cases cochées.
- Migration automatique des données V1 ou V2 ; sauvegardes V2 acceptées.

## Formation et données personnelles

Le contenu de la formation et le dossier de contacts ne sont pas dans ce dépôt
public. Dans « Ma formation », choisir « Importer mon mindmap », sélectionner
le dossier JSON fourni séparément et cliquer sur « Fusionner avec mes données ».
Le format dédié `mf-tools-formation` permet également d’importer seulement la
formation. L’import vérifie les identifiants, les parents, les cycles et les
limites de volume avant d’enregistrer.

La navigation reprend l’arborescence, les branches libres, les synthèses et les
liens. La disposition graphique exacte de XMind n’est pas reproduite. Les notes
de formation sont présentées comme une source de travail à adapter ; leur
import ne remplace ni les tarifs ni les réglages de l’application.

Les données sont stockées dans `localStorage` sous `mf_tools_v3`. La migration
laisse `mf_tools_v2` et les anciennes clés V1 intactes. La sauvegarde JSON V3
inclut les données, le mindmap, les favoris et les notes. La fusion conserve les
dossiers déjà présents ; la restauration complète demande une confirmation et
conserve l’état précédent sous `mf_tools_v3_before_restore` si l’espace suffit.
Une nouvelle version du même mindmap conserve les annotations ; un import qui
ferait disparaître un sujet annoté est refusé.

## Publication et utilisation

Publier les fichiers de ce dossier à la racine du dépôt GitHub Pages. Conserver
la même adresse pour retrouver les données de l’appareil. Les fichiers JSON
personnels et les sauvegardes doivent rester hors du dépôt public.

Ouvrir le site avec une connexion, puis consulter Réglages pour vérifier
« Hors ligne prêt ». Une nouvelle version du cache attend une actualisation
explicite. Le cache est limité au périmètre de MF Tools.

Sur iPad : Safari → Partager → Sur l’écran d’accueil. PC, Safari et l’application
sur l’écran d’accueil peuvent avoir des stockages distincts ; exporter et importer
une sauvegarde pour transférer les données. Aucune synchronisation automatique.

HTML, CSS et JavaScript ES5 sans dépendance distante. Mise en page adaptative et
affichage progressif des résultats de recherche pour limiter le travail sur les
anciens iPad. La compatibilité avec un iPad physique sous iOS 12 reste à vérifier
sur cet appareil.
