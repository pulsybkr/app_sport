// Ajoute un écouteur d'événement sur le bouton "Retour"

console.log('about.ts');

const backButton = document.getElementById('backButton');
if (backButton) {
    backButton.addEventListener('click', () => {
<<<<<<< HEAD
        window.location.href = 'index.html';
        
=======
        window.location.href = '/';
>>>>>>> dev_pulsy
    });
}
