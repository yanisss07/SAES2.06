# Atlas Métro Art Toulouse

**URL du projet : https://oeuvre-carte-metro.vercel.app/**

Plateforme web immersive consacrée aux œuvres d'art présentes sur les lignes A et B du métro toulousain. L'expérience se déroule en trois temps : un préchargement brandé, une transition visuelle évoquant un zoom orbital vers Toulouse, puis une carte stylisée invitant à explorer station par station.

## Vision de l'expérience
- **Chargement scénarisé** : écran de loading plein écran avec les logos du projet (dépôt d'actifs dans `./assets/`) et une barre de progression prête à être branchée sur un futur préchargement de médias.
- **Transition orbitale** : scène canvas personnalisée qui simule une planète en rotation, halo lumineux et survol du point toulousain avant de basculer sur la carte.
- **Carte vivante** : carte Leaflet sombre avec tracés néon des lignes A et B, stations cliquables renvoyant vers les pages de détail.
- **Guidage utilisateur** : après 5 s sans interaction sur la carte, un hint animé « Cliquez sur une station » apparaît côté bas-gauche. Toute interaction ou sélection le masque.
- **Fiches stations (phase suivante)** : un panneau latéral affiche déjà titre, artiste et description succincte de l'œuvre ; le bouton « Explorer la station » est présent mais désactivé en attendant la production des pages détaillées (vidéos, crédits étendus, etc.).

## Structure du dépôt
- `index.html` : point d'entrée unique orchestrant loader, scène 3D et carte.
- `styles/main.css` : feuille de style principale (loader, transitions, panneau station, hint).
- `details_ligne_A.html`, `details_ligne_B.html` : fiches station existantes (WIP) ouvertes depuis la carte.
- `src/` :
  - `main.js` : coordination de l'expérience (chargement, enchaînement des étapes, gestion des hints).
  - `globe.js` : scène Three.js locale (globe texturé, halo, zoom progressif vers Toulouse).
  - `map.js` : intégration Leaflet (polylignes Catmull-Rom, tooltips riches, navigation vers les fiches stations).
  - `data/stations.js` : métadonnées des stations (coordonnées, artistes, descriptions).
  - `ui.js` : composants interface (hint animé, panneau station).
  - `loader.js` : gestionnaire de l'overlay de chargement.
- `vendor/` : dépendances JavaScript locales (copie de `three.module.js`).
- `assets/` : logos placeholders et ressources déplacées (`img.png`, `photo1A.png`, `SAES2.svg`, support PDF, etc.).
- `archive/` : prototype Leaflet d'origine conservé pour référence (`SAES2.html`, CSS/JS associés, pages de détails).

## Système de chargement des images (fiches stations)

Les images des fiches station utilisent deux techniques combinées pour éviter les écrans noirs sur connexion lente.

### Images principales et galeries (`main.jpg`, `1.jpg`, `2.jpg`…)
Encodées en **JPEG progressif** (`-interlace Plane`). Le navigateur reçoit et affiche l'image en plusieurs passes successives : d'abord floue sur toute sa surface, puis de plus en plus nette au fil de la réception des données — exactement comme Pinterest ou Medium.

Pour `main.jpg` spécifiquement, un **miniature** (`main_thumb.jpg`, ~20 px de large, quelques Ko) s'affiche immédiatement pendant que le JPEG progressif se charge, ce qui évite tout écran noir initial. Quand le JPEG est prêt, la miniature disparaît avec une transition de flou.

Une **barre de chargement rouge animée** apparaît en bas de chaque cadre image jusqu'à la fin du téléchargement.

### Image de fond (`background.png` / `background_thumb.jpg`)
Le fond utilise un système de **blur-up** : la miniature très floue (`background_thumb.jpg`, ~30 px) s'affiche immédiatement, puis le fond complet se substitue avec une transition douce une fois chargé.

### Scripts à relancer si on ajoute une station
```bash
bash convert-to-progressive-jpeg.sh   # convertit main.png et les extras en JPEG progressif
bash generate-thumbs.sh               # génère main_thumb.jpg et background_thumb.jpg
```
> `convert-to-progressive-jpeg.sh` doit être lancé **avant** `generate-thumbs.sh` (la miniature est générée depuis `main.jpg`).

### Structure des fichiers média par station
```
media/{id}/
├── main.jpg              ← JPEG progressif (artwork principal)
├── main_thumb.jpg        ← miniature ~20px (générée automatiquement)
├── background.png        ← fond pleine résolution
├── background_thumb.jpg  ← miniature floue ~30px (générée automatiquement)
├── logo.svg              ← logo affiché dans le header
├── 1.jpg … 8.jpg         ← galerie extras en JPEG progressif (optionnel)
├── artist.txt            ← nom et bio de l'artiste (1re ligne = nom)
└── oeuvre.txt            ← titre et description de l'œuvre (1re ligne = titre)
```

## Fondations techniques
- **JavaScript natif** (`type="module"`) pour orchestrer loader, globe et carte sans bundler.
- **Three.js** (copie locale en `vendor/three.module.js`) pour la scène 3D orbitale.
- **Leaflet 1.9.4** (fichiers locaux dans `vendor/`) pour la carte interactive et les tooltips stations.
- **Texturing** : image nocturne de la Terre (`assets/earth-night.jpg`), halo atmosphérique et points stars générés à la volée.
- **Stylisme** : approche glassmorphique légère + animations CSS, palette sombre inspirée des tunnels et néons.

## Lancer l'expérience en local
1. Ouvrez un terminal à la racine du projet.
2. Servez le dossier via n'importe quel serveur statique (exemples) :
   - `python3 -m http.server 5173`
   - `npx serve .`
   - Extension Live Server VS Code.
3. Visitez `http://localhost:5173` (ou le port indiqué) et laissez le chargement se dérouler jusqu'à la carte.

> Important : Three.js et MapLibre nécessitent de charger `index.html` via HTTP/HTTPS (pas via `file://`) pour fonctionner correctement.

## Feuille de route immédiate
- Ajouter des textures supplémentaires (nuages, bump map) et finaliser le shading de la planète.
- Finaliser l'animation de transition (atténuation du globe, fondu synchronisé avec l'apparition de la carte, trajectoire discrète vers Toulouse).
- Concevoir les pages stations : maquettes, navigation, intégration vidéo/son, crédits.
- Ajouter une couche sonore (ambiance métro + voix off) avec option mute.
- Affiner la data : vérification des coordonnées, ajout de métadonnées (année, type d'œuvre, matériaux, anecdotes).
- Mettre en place un système de routage (hash ou client-side) pour partager un lien direct vers une station.

## Héritage du prototype Leaflet
L'ancien proof of concept reste accessible dans `archive/` pour consultation rapide des idées initiales. Il n'est plus servi par défaut mais peut guider la migration des contenus (tooltips, listes d'œuvres).

---
Projet initié dans le cadre de la SAÉ 2.06 – objectif : offrir un récit interactif autour du patrimoine artistique du métro toulousain. Contributions bienvenues pour enrichir données, visuels et expérience utilisateur.
