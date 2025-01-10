// import L from 'leaflet';
import { loadView } from "../app.js";
import { showToast } from "../toast.js";
import { activityService } from "../services/activity.service.js";

const loadParcourList = async (filterType?: string) => {
    const parcoursList = document.getElementById('parcours-list');
    const template = document.getElementById('parcours-item-template') as HTMLTemplateElement;
    const parcours = JSON.parse(localStorage.getItem('parcours') || '[]');

    if (parcoursList && template) {
        parcoursList.innerHTML = '';

        // Filtrer les parcours si un type est spécifié
        const filteredParcours = filterType 
            ? parcours.filter((p: any) => p.type === filterType)
            : parcours;

        filteredParcours.forEach((parcour: any) => {
            const clone = template.content.cloneNode(true) as DocumentFragment;
            
            // Remplir les données du template
            if (clone.querySelector('.parcours-name')) {
                clone.querySelector('.parcours-name')!.textContent = parcour.name;
            }
            if (clone.querySelector('.parcours-type')) {
                clone.querySelector('.parcours-type')!.textContent = `${parcour.type || ""}`;
            }
            if (clone.querySelector('.parcours-distance')) {
                clone.querySelector('.parcours-distance')!.textContent = `${(parcour.distance / 1000).toFixed(2)} km`;
            }
            
            parcoursList.appendChild(clone);
        });
    }
}

const loadParcours = async () => {
    const myParcours = document.getElementById('my-parcours');
    
    // console.log(parcours);
    if (myParcours) {
        myParcours.innerHTML = await loadView('./views/dashboard/components/my-parcour.html');
        loadParcourList();
        // Récupérer la liste des parcours et l'élément conteneur
        
    } else {
        console.log('myParcours not found');
    }
    const newParcour = document.getElementById('new-parcour');
    const modalNewParcour = document.getElementById('modal-new-parcour');
    const closeParcour = document.getElementById('close-parcour');
    if (newParcour) {
        newParcour.addEventListener('click', () => {
            console.log('newParcour');
            if (modalNewParcour && closeParcour) {
                modalNewParcour.classList.remove('hidden');
                modalNewParcour.classList.add('flex');
                closeParcour.addEventListener('click', () => {
                    modalNewParcour.classList.remove('flex');
                    modalNewParcour.classList.add('hidden');
                });
            }
            // if (saveParcour) {
            //     saveParcour.addEventListener('click', () => {
            //         console.log('saveParcour');
            //     });
            // }
        });
    } else {
        console.log('newParcour not found');
    }

    initActivityCreation();
}

setTimeout(() => {
    const mapElement = document.getElementById('map');
    
    if (mapElement) {
        console.log('Initialisation de la carte');
        var map = L.map('map');
        // Tableau pour stocker les points du parcours
        let points: L.LatLngExpression[] = [];
        let polyline: L.Polyline | null = null;
        const saveParcour = document.getElementById('save-parcour');

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Gestionnaire de clic sur la carte
        map.on('click', function(e) {
            const point: L.LatLngExpression = [e.latlng.lat, e.latlng.lng];
            points.push(point);
            
            // Ajouter un marqueur
            L.marker(point).addTo(map);
            
            // Mettre à jour la ligne du parcours
            if (polyline) {
                map.removeLayer(polyline);
            }
            polyline = L.polyline(points, {color: 'red'}).addTo(map);
            
            // Calculer et afficher la distance
            if (points.length > 1) {
                let distance = 0;
                for (let i = 1; i < points.length; i++) {
                    distance += map.distance(points[i-1], points[i]);
                }
                const distanceElement = document.getElementById('distance-parcours');
                if (distanceElement) {
                    distanceElement.textContent = `Distance: ${Math.round(distance)} mètres`;
                }
            }
        });

        // Bouton pour réinitialiser le parcours
        const resetButton = document.getElementById('reset-parcours');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                points = [];
                if (polyline) {
                    map.removeLayer(polyline);
                }
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });
                const distanceElement = document.getElementById('distance-parcours');
                if (distanceElement) {
                    distanceElement.textContent = '';
                }
            });
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 13);
                
                L.marker([latitude, longitude]).addTo(map)
                    .bindPopup('Ma position actuelle !')
                    .openPopup();
            },
            (error) => {
                console.error('Erreur de géolocalisation:', error);
                map.setView([51.505, -0.09], 13);
            }
        );

        // Gestionnaire pour sauvegarder le parcours
        const nameParcour = document.getElementById('name-parcour') as HTMLInputElement;
        const typeParcour = document.getElementById('type-parcour') as HTMLSelectElement;
        if (saveParcour) {
            saveParcour.addEventListener('click', () => {
                if (points.length < 2) {
                    showToast('Veuillez créer un parcours avec au moins 2 points', 'error');
                    return;
                }

                if (!nameParcour.value || !typeParcour.value) {
                    showToast('Veuillez donner un nom et un type à votre parcours', 'error');
                    return;
                }

                // Calculer la distance totale
                let distance = 0;
                for (let i = 1; i < points.length; i++) {
                    distance += map.distance(points[i-1], points[i]);
                }

                const parcourData = {
                    id: generateId(),
                    name: nameParcour.value,
                    points: points,
                    type: typeParcour.value,
                    distance: Math.round(distance),
                    date: new Date().toISOString()
                };

                // Sauvegarder dans le localStorage (temporaire)
                const parcours = JSON.parse(localStorage.getItem('parcours') || '[]');
                parcours.push(parcourData);
                localStorage.setItem('parcours', JSON.stringify(parcours));

                // Fermer la modal et réinitialiser
                const modalNewParcour = document.getElementById('modal-new-parcour');
                if (modalNewParcour) {
                    modalNewParcour.classList.remove('flex');
                    modalNewParcour.classList.add('hidden');
                }

                // Réinitialiser la carte
                points = [];
                if (polyline) {
                    map.removeLayer(polyline);
                }
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });
                const distanceElement = document.getElementById('distance-parcours');
                if (distanceElement) {
                    distanceElement.textContent = '';
                }
                nameParcour.value = '';

                showToast('Parcours sauvegardé', 'success');
                loadParcourList();
            });
        }
    }
}, 100);

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const loadParcoursByType = (type: string) => {
    const parcours = JSON.parse(localStorage.getItem('parcours') || '[]');
    return parcours.filter((p: any) => p.type === type);
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const initActivityCreation = () => {
    const typeSelect = document.getElementById('activity-type') as HTMLSelectElement;
    const parcoursSelect = document.getElementById('activity-parcours') as HTMLSelectElement;
    const parcoursDistance = document.getElementById('parcours-distance');

    if (typeSelect && parcoursSelect) {
        typeSelect.addEventListener('change', async () => {
            const selectedType = typeSelect.value;
            const parcours = loadParcoursByType(selectedType);

            // Vider et remplir le select des parcours
            parcoursSelect.innerHTML = '<option value="">Sélectionnez un parcours</option>';

            // Obtenir la position actuelle
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;

                    // Trier les parcours par distance par rapport à la position actuelle
                    const parcoursWithDistance = parcours.map((p: any) => {
                        const startPoint = p.points[0];
                        const distance = calculateDistance(
                            userLat, 
                            userLon, 
                            startPoint[0], 
                            startPoint[1]
                        );
                        return { ...p, distanceFromUser: distance };
                    });

                    parcoursWithDistance.sort((a: any, b: any) => a.distanceFromUser - b.distanceFromUser);

                    // Ajouter les options triées
                    parcoursWithDistance.forEach((p: any) => {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = `${p.name} (${Math.round(p.distanceFromUser * 10) / 10} km)`;
                        parcoursSelect.appendChild(option);
                    });
                },
                (error) => {
                    console.error('Erreur de géolocalisation:', error);
                    // Ajouter les parcours sans tri si la géolocalisation échoue
                    parcours.forEach((p: any) => {
                        const option = document.createElement('option');
                        option.value = p.id;
                        option.textContent = p.name;
                        parcoursSelect.appendChild(option);
                    });
                }
            );
        });
        parcoursSelect.addEventListener('change', () => {
            const parcours = loadParcoursByType(typeSelect.value);
            const selectedParcours = parcours.find((p: any) => p.id === parcoursSelect.value);
            if (selectedParcours && parcoursDistance) {
                parcoursDistance.textContent = 
                    `Distance du parcours : ${(selectedParcours.distance / 1000).toFixed(2)} km`;
            }
        });
    }
};

const createActivity = () => {
    const modalActivity = document.getElementById('modal-activity');
    const closeActivity = document.getElementById('close-activity');
    const createActivity = document.getElementById('create-activity');
    const saveActivity = document.getElementById('save-activity');
    if (createActivity) {
    createActivity.addEventListener('click', () => {
        if (modalActivity) {
            modalActivity.classList.remove('hidden');
            modalActivity.classList.add('flex');
            if (closeActivity) {
                closeActivity.addEventListener('click', () => {
                    modalActivity.classList.remove('flex');
                    modalActivity.classList.add('hidden');
                });
            }

            if (saveActivity) {
                saveActivity.addEventListener('click', async () => {
                    const activityName = document.getElementById('activity-name') as HTMLInputElement;
                    const activityType = document.getElementById('activity-type') as HTMLSelectElement;
                    const activityParcours = document.getElementById('activity-parcours') as HTMLSelectElement;
                    
                    try {
                        const parcours = JSON.parse(localStorage.getItem('parcours') || '[]')
                            .find((p: any) => p.id === activityParcours.value);

                        await activityService.createActivity({
                            name: activityName.value,
                            type: activityType.value,
                            parcoursId: activityParcours.value,
                            distance: parcours?.distance || 0,
                        });

                        // Au lieu d'utiliser une route dynamique, on redirige vers une page fixe
                        window.location.href = '/app';
                        
                        showToast('Activité créée avec succès', 'success');
                    } catch (error) {
                        showToast('Erreur lors de la création de l\'activité', 'error');
                        console.error(error);
                    }
                });
            }
        }
    });
    }
    
}

createActivity();

loadParcours();

