// Les données des stations avec les informations extraites
const stationData = {
    "colomiers": {
        title: "Les joueurs de lumière",
        artist: "Lilian Bourgeat",
        description: "Deux grands catadioptres ronds placés au mur, évoquant un centre d'observation du ciel et des astres...",
        photo_url: "url_de_la_photo_colomiers.jpg" // À remplacer par les vrais liens d'images
    },
    "saint-martin": {
        title: "Le Ciel est vertical",
        artist: "Cécile Bart",
        description: "Deux suites verticales d'images et deux diaporamas...",
        photo_url: "url_de_la_photo_saint_martin.jpg"
    }
    // Ajoutez les données de toutes les autres stations ici
};

const infoBox = document.getElementById('info-box');
const infoTitle = document.getElementById('info-title');
const infoArtist = document.getElementById('info-artist');
const infoDescription = document.getElementById('info-description');
const infoPhoto = document.getElementById('info-photo');

// Fonction pour mettre à jour la boîte d'information
function updateInfoBox(stationId) {
    const data = stationData[stationId];
    if (data) {
        infoTitle.textContent = data.title;
        infoArtist.textContent = `Artiste : ${data.artist}`;
        infoDescription.textContent = data.description;
        infoPhoto.src = data.photo_url;
        infoPhoto.alt = `Photo de l'œuvre "${data.title}"`;
        infoBox.style.display = 'block';
    }
}

// Fonction pour masquer la boîte d'information
function hideInfoBox() {
    infoBox.style.display = 'none';
}

// Ajouter les écouteurs d'événements aux points de station (utilisez les classes CSS ou la balise <area>)
document.querySelectorAll('.station-point').forEach(area => {
    area.addEventListener('mouseover', (e) => {
        updateInfoBox(e.target.dataset.stationId);
        // Positionner la boîte à côté du curseur (ajustement nécessaire)
        infoBox.style.left = `${e.pageX + 20}px`;
        infoBox.style.top = `${e.pageY + 20}px`;
    });

    area.addEventListener('mouseout', hideInfoBox);
});