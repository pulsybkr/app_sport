// // index.ts
// const routes: { [key: string]: () => string } = {
//     '/': () => '<h1>Bienvenue sur la page d\'accueil</h1>',
//     '/about': () => '<h1>À Propos de nous</h1>',
// };

// function navigate(event: MouseEvent, path: string) {
//     event.preventDefault();
//     history.pushState({}, '', path);
//     render(path);
// }

// function render(path: string) {
//     const content = document.getElementById('content');
//     if (content) {
//         content.innerHTML = routes[path] ? routes[path]() : '<h1>404 - Page non trouvée</h1>';
//     }
// }

// // Écouter les changements d'historique
// window.onpopstate = () => {
//     render(location.pathname);
// };

// // Initialiser le rendu
// render(location.pathname);

// index.ts

// index.ts
// index.ts

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button') as HTMLButtonElement;

    if (startButton) {
        startButton.addEventListener('click', () => {
            console.log('Le bouton "Commencer" a été cliqué !');
            alert('Bouton cliqué !');
        });
    } else {
        console.error('Le bouton "Commencer" n\'a pas été trouvé.');
    }
});
