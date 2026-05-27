(function () {
    var URL = 'https://quai-des-arts.vercel.app/';
    var btn = document.getElementById('share-btn');
    var popup = document.getElementById('share-popup');
    var copyBtn = document.getElementById('share-copy');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({ title: 'Quai des Arts', text: 'Découvrez l\'art caché du métro toulousain.', url: URL });
        } else {
            popup.hidden = !popup.hidden;
        }
    });

    if (copyBtn) {
        copyBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navigator.clipboard.writeText(URL).then(function () {
                copyBtn.textContent = 'Copié !';
                copyBtn.classList.add('is-copied');
                setTimeout(function () {
                    copyBtn.textContent = 'Copier';
                    copyBtn.classList.remove('is-copied');
                    popup.hidden = true;
                }, 1800);
            });
        });
    }

    document.addEventListener('click', function (e) {
        if (!popup.hidden && !btn.contains(e.target) && !popup.contains(e.target)) {
            popup.hidden = true;
        }
    });
})();
