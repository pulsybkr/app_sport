import { getWeather } from "./weather.js";
import { displayWeather } from "./weather.js";

let map: google.maps.Map | undefined;
let directionsService: google.maps.DirectionsService | undefined;
let directionsRenderer: google.maps.DirectionsRenderer | undefined;

function initMap() {
    // Fonction pour récupérer les coordonnées géographiques de l'utilisateur
    const getGeolocation = (): Promise<google.maps.LatLngLiteral> => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        resolve({ lat: latitude, lng: longitude });
                    },
                    (error) => {
                        reject("Erreur de géolocalisation: " + error.message);
                    }
                );
            } else {
                reject("Géolocalisation non supportée par ce navigateur");
            }
        });
    };

    // Fonction pour afficher la carte
    const showMap = (center: google.maps.LatLngLiteral) => {
        map = new google.maps.Map(document.getElementById("map")!, {
            center: center,
            zoom: 12, // Niveau de zoom modifié pour un zoom plus rapproché
        });

        // Initialisation du service de directions
        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map); // Ajout de l'itinéraire à la carte

        // Ajouter un marqueur à la position actuelle
        new google.maps.Marker({
            position: center,
            map: map,
            title: "Votre position",
        });

// Ouvrir la popup au clic sur le bouton
document.getElementById("newActivityBtn")?.addEventListener("click", () => {
    const popup = document.getElementById("activityFormPopup");
    popup?.classList.add("show");
});

// Fermer la popup au clic sur le bouton "X"
document.getElementById("closePopupBtn")?.addEventListener("click", () => {
    const popup = document.getElementById("activityFormPopup");
    popup?.classList.remove("show");
});

        // Gestion du formulaire de lancement d'une activité
        document.getElementById("activityForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const start = (document.getElementById("start") as HTMLInputElement).value;
            const end = (document.getElementById("end") as HTMLInputElement).value;
            const transport = (document.getElementById("transport") as HTMLSelectElement).value;

            // Obtenir l'itinéraire
            getRoute(start, end, transport);
        });
    };

    // Fonction pour ouvrir la popup de création d'activité
    const openActivityForm = () => {
        document.getElementById("activityFormPopup")!.style.display = 'flex';
    };

    // Fonction pour fermer la popup
    const closeActivityForm = () => {
        document.getElementById("activityFormPopup")!.style.display = 'none';
    };

    // Fonction pour obtenir l'itinéraire en fonction des points de départ, arrivée et du moyen de transport
const getRoute = (start: string, end: string, transportMode: string) => {
    const validTransportModes = [
        google.maps.TravelMode.WALKING,
        google.maps.TravelMode.BICYCLING,
        google.maps.TravelMode.DRIVING
    ];

    // Vérifier si le mode de transport est valide
    if (!validTransportModes.includes(google.maps.TravelMode[transportMode.toUpperCase() as keyof typeof google.maps.TravelMode])) {
        alert("Mode de transport invalide");
        return;
    }

    const request: google.maps.DirectionsRequest = {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode[transportMode.toUpperCase() as keyof typeof google.maps.TravelMode],
    };

    if (directionsService && directionsRenderer) {
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                // Affichage de l'itinéraire sur la carte
                directionsRenderer!.setDirections(result);

                // Récupérer les données de l'itinéraire
                const route = result!.routes[0];
                const leg = route.legs[0];

                // Affichage de la distance et de la durée dans les éléments correspondants
                const distance = leg.distance!.text; // "12.3 km"
                const duration = leg.duration!.text; // "15 min"
                const travelMode = transportMode.charAt(0).toUpperCase() + transportMode.slice(1).toLowerCase(); // Mise en majuscule du mode de transport

                // Mise à jour des éléments HTML
                document.getElementById('actData-Distance')!.textContent = distance;
                document.getElementById('actData-Duration')!.textContent = duration;
                document.getElementById('actData-TravelWay')!.textContent = getRecommendedTravelWay(travelMode);
            } else {
                alert("Impossible de calculer l'itinéraire: " + status);
            }
        });
    }
};

// Fonction pour recommander un moyen de transport basé sur le mode de transport
function getRecommendedTravelWay(mode: string) {
    switch (mode) {
        case "Driving":
            return "Voiture";
        case "Walking":
            return "Marche";
        case "Bicycling":
            return "Vélo";
        default:
            return "Inconnu";
    }
}
    

getGeolocation()
.then((coords) => {
    // Si les coordonnées sont récupérées, afficher la carte avec ces coordonnées
    showMap(coords);

    // Récupérer la météo pour la position de l'utilisateur
    getWeather(coords.lat, coords.lng)
        .then((weather) => {
            // Afficher la météo
            displayWeather(weather);
        })
        .catch((error) => {
            console.error("Erreur de récupération de la météo : ", error);
        });
})
.catch((errorMessage) => {
    console.error(errorMessage);

    // Si l'utilisateur refuse la géolocalisation ou si une erreur survient, afficher la carte avec des coordonnées par défaut
    const defaultCoords = { lat: 25.254875, lng: -0.25456565 }; // Coordonnées par défaut
    showMap(defaultCoords);

    // Récupérer la météo pour ces coordonnées par défaut
    getWeather(defaultCoords.lat, defaultCoords.lng)
        .then((weather) => {
            // Afficher la météo
            displayWeather(weather);
        })
        .catch((error) => {
            console.error("Erreur de récupération de la météo par défaut : ", error);
        });
});
}

initMap();
