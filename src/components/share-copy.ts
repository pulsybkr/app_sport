async function handleShare(activity: any) {
    try {
        if (navigator.share) {
            await navigator.share({
                title: `Activité ${activity.type}`,
                text: `Découvrez mon activité ${activity.type} de ${activity.distance}km en ${activity.duration}!`,
                url: window.location.href
            });
        } else {
            // Fallback avec l'API Clipboard
            const shareUrl = window.location.href;
            await navigator.clipboard.writeText(shareUrl);
            
            // Notification utilisant l'API Notifications
            if (Notification.permission === "granted") {
                new Notification("Lien copié !", {
                    body: "Le lien de l'activité a été copié dans le presse-papier",
                    icon: "/assets/icon.png"
                });
            } else {
                // Fallback avec alert()
                alert("Le lien de l'activité a été copié dans le presse-papier");
            }
        }
    } catch (error) {
        console.error('Erreur lors du partage:', error);
    }
}

async function handleDuplicate(activity: any) {
    try {
        const activityCopy = {
            type: activity.type,
            distance: activity.distance,
            duration: activity.duration,
            date: new Date().toISOString(),
            calories: activity.calories
        };

        // Stocker dans le localStorage
        localStorage.setItem('activity-clipboard', JSON.stringify(activityCopy));

        // Copier dans le presse-papier système
        const textToCopy = `Activité ${activity.type} - ${activity.distance}km en ${activity.duration}`;
        await navigator.clipboard.writeText(textToCopy);

        // Notification de succès
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Activité dupliquée !", {
                body: "L'activité a été copiée dans le presse-papier",
                icon: "/assets/icon.png"
            });
        } else {
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
            notification.textContent = "L'activité a été copiée dans le presse-papier";
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        const button = document.querySelector(`[data-activity-id="${activity.id}"] .duplicate-activity`);
        if (button) {
            const originalBg = button.className;
            button.className = button.className.replace('bg-blue-500', 'bg-green-500');
            setTimeout(() => {
                button.className = originalBg;
            }, 1000);
        }

    } catch (error) {
        console.error('Erreur lors de la duplication:', error);
        
        // Notification d'erreur
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
        notification.textContent = "Erreur lors de la copie de l'activité";
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

async function initNotifications() {
    if (Notification.permission === "default") {
        await Notification.requestPermission();
    }
}

document.getElementById('recent-activities')?.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const activityItem = target.closest('.activity-item') as HTMLElement | null;
    
    if (!activityItem) return;
    
    const activityData = {
        id: activityItem.getAttribute('data-activity-id'),
        type: activityItem.getAttribute('data-type'),
        distance: activityItem.getAttribute('data-distance'),
        duration: activityItem.getAttribute('data-duration')
    };

    if (target.closest('.share-activity')) {
        await handleShare(activityData);
    } else if (target.closest('.duplicate-activity')) {
        await handleDuplicate(activityData);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
});

document.querySelectorAll('.activity-item').forEach(item => {
    item.setAttribute('draggable', 'true');
    
    item.addEventListener('dragstart', (e: Event) => {
        const dragEvent = e as DragEvent;
        const activity = (dragEvent.target as HTMLElement).closest('.activity-item') as HTMLElement | null;
        if (!activity) return;
        
        dragEvent.dataTransfer?.setData('text/plain', JSON.stringify({
            type: 'activity',
            data: {
                id: activity.getAttribute('data-activity-id'),
                type: activity.getAttribute('data-type'),
            }
        }));
    });
});

document.getElementById('recent-activities')?.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
});

document.getElementById('recent-activities')?.addEventListener('drop', async (e: DragEvent) => {
    e.preventDefault();
    
    try {
        const data = JSON.parse(e.dataTransfer?.getData('text/plain') || '');
        if (data.type === 'activity') {
            await handleDuplicate(data.data);
        }
    } catch (error) {
        console.error('Erreur lors du drop:', error);
    }
});

async function pasteActivity() {
    try {
        const savedActivity = localStorage.getItem('activity-clipboard');
        if (savedActivity) {
            const activity = JSON.parse(savedActivity);
            // Ici, vous pouvez implémenter la logique pour créer une nouvelle activité
            console.log('Activité collée:', activity);
            
            // Notification de succès
            const notification = document.createElement('div');
            notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
            notification.textContent = "Activité collée avec succès";
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    } catch (error) {
        console.error('Erreur lors du collage:', error);
    }
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteActivity();
    }
}); 
