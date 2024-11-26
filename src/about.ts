// Ajoute un écouteur d'événement sur le bouton "Retour"

console.log('about.ts');

const backButton = document.getElementById('backButton');
if (backButton) {
    backButton.addEventListener('click', () => {
        window.location.href = '/';
    });
}
