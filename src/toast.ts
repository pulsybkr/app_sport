export function showToast(message: string, type: string) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;

    // Créer le bouton de fermeture
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close';
    closeButton.innerText = '×'; // Symbole de fermeture
    closeButton.onclick = () => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    };

    // Ajouter le bouton de fermeture au toast
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        toast.appendChild(closeButton);
        toastContainer.appendChild(toast);
    }
    
    // Supprime le toast après 3 secondes si non fermé
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 500);
        }
    }, 3000);
}

console.log('toast.ts');