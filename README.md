# Atlas Métro Art Toulouse

Plateforme web immersive consacrée aux œuvres d'art présentes sur les lignes A et B du métro toulousain. L'expérience se déroule en trois temps : un préchargement brandé, une transition 3D type « Google Earth » qui zoome sur Toulouse, puis une carte interactive invitant à explorer station par station.

## Vision de l'expérience
- **Chargement scénarisé** : écran de loading plein écran avec les logos du projet (dépôt d'actifs dans `./assets/`) et une barre de progression prête à être branchée sur un futur préchargement de médias.
- **Transition orbitale** : scène Three.js affichant la Terre, un halo atmosphérique et un marqueur lumineux sur Toulouse. La caméra réalise un zoom contrôlé vers la ville avant de laisser place à la carte.
- **Carte vivante** : vue MapLibre GL centrée sur Toulouse, stylée en sombre, tracés des lignes A et B colorés, cercles cliquables pour chaque station.
- **Guidage utilisateur** : après 5 s sans interaction sur la carte, un hint animé « Cliquez sur une station » apparaît côté bas-gauche. Toute interaction ou sélection le masque.
- **Fiches stations (phase suivante)** : un panneau latéral affiche déjà titre, artiste et description succincte de l'œuvre ; le bouton « Explorer la station » est présent mais désactivé en attendant la production des pages détaillées (vidéos, crédits étendus, etc.).

## Structure du dépôt
- `index.html` : point d'entrée unique orchestrant loader, scène 3D et carte.
- `styles/main.css` : feuille de style principale (loader, transitions, panneau station, hint).
- `src/` :
  - `main.js` : coordination de l'expérience (chargement, enchaînement des étapes, gestion des hints).
  - `globe.js` : scène Three.js (Terre stylisée, zoom vers Toulouse).
  - `map.js` : intégration MapLibre GL + sources GeoJSON pour les lignes/stations.
  - `data/stations.js` : métadonnées des stations (coordonnées, artistes, descriptions).
  - `ui.js` : composants interface (hint animé, panneau station).
  - `loader.js` : gestionnaire de l'overlay de chargement.
- `assets/` : logos placeholders et ressources déplacées (`img.png`, `photo1A.png`, `SAES2.svg`, support PDF, etc.).
- `archive/` : prototype Leaflet d'origine conservé pour référence (`SAES2.html`, CSS/JS associés, pages de détails).

## Fondations techniques
- **Three.js** (`cdn.jsdelivr.net`) pour la scène orbitale et le zoom.
- **MapLibre GL** (`cdn.jsdelivr.net`) pour la carte 3D/2D libre et personnalisable.
- **JavaScript natif modules** (`type="module"`) pour éviter un bundler à ce stade.
- **Stylisme** : approche glassmorphique légère + animations CSS, palette sombre inspirée des tunnels et néons.

Toutes les dépendances sont chargées via CDN : gardez une connexion internet lors du développement/visionnage ou prévoyez un mirroir local si nécessaire.

## Lancer l'expérience en local
1. Ouvrez un terminal à la racine du projet.
2. Servez le dossier via n'importe quel serveur statique (exemples) :
   - `python3 -m http.server 5173`
   - `npx serve .`
   - Extension Live Server VS Code.
3. Visitez `http://localhost:5173` (ou le port indiqué) et laissez le chargement se dérouler jusqu'à la carte.

> Important : Three.js et MapLibre nécessitent de charger `index.html` via HTTP/HTTPS (pas via `file://`) pour fonctionner correctement.

## Feuille de route immédiate
- Produire ou récupérer les vraies textures (Terre nocturne, nuages) et brancher le loader sur leur préchargement.
- Finaliser l'animation de transition (atténuation du globe, fondu synchronisé avec l'apparition de la carte, éventuelle trajectoire custom).
- Concevoir les pages stations : maquettes, navigation, intégration vidéo/son, crédits.
- Ajouter une couche sonore (ambiance métro + voix off) avec option mute.
- Affiner la data : vérification des coordonnées, ajout de métadonnées (année, type d'œuvre, matériaux, anecdotes).
- Mettre en place un système de routage (hash ou client-side) pour partager un lien direct vers une station.

## Héritage du prototype Leaflet
L'ancien proof of concept reste accessible dans `archive/` pour consultation rapide des idées initiales. Il n'est plus servi par défaut mais peut guider la migration des contenus (tooltips, listes d'œuvres).

---
Projet initié dans le cadre de la SAÉ 2.06 – objectif : offrir un récit interactif autour du patrimoine artistique du métro toulousain. Contributions bienvenues pour enrichir données, visuels et expérience utilisateur.
