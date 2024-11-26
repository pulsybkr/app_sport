<<<<<<< HEAD
// Gestionnaire des routes
const routes: { [key: string]: string } = {
    '/': 'index.html',
    '/about': 'about.html',
    '/login': 'login.html'
};

// Fonction pour charger le contenu d'une page HTML
function loadPage(url: string): void {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Page non trouvée');
            }
            return response.text();
        })
        .then(html => {
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.innerHTML = html;
            }
        })
        .catch(error => {
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.innerHTML = `<h1>Erreur: ${error.message}</h1>`;
            }
        });
}

// Fonction pour naviguer et charger les routes
function navigateTo(url: string): void {
    history.pushState(null, '', url);  // Change l'URL sans recharger la page
    updateContent();  // Met à jour le contenu
}

// Fonction pour mettre à jour le contenu de la page
function updateContent(): void {
    const path = window.location.pathname;
    const route = routes[path] || '404.html';  // Si la route n'existe pas, affiche une page 404
    loadPage(route);
}


// Gestion de l'événement de clic sur les liens
document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.matches('[data-link]')) {
        e.preventDefault();
        navigateTo(target instanceof HTMLAnchorElement ? target.href : '');  // Empêche le chargement de la page et appelle navigateTo
    }
});

// Gestion du retour en arrière/avant dans le navigateur
window.addEventListener('popstate', updateContent);

// Chargement initial de la page
document.addEventListener('DOMContentLoaded', updateContent);
=======
console.log('index.ts');
>>>>>>> dev_pulsy
