const apiKey = "b9ee311ad7b281d94595578c04e4a906"; // Remplacez par votre clé API

interface WeatherData {
    temperature: number;
    description: string;
    city: string;
}

// Fonction pour récupérer les données météo en fonction de la latitude et de la longitude
export const getWeather = async (latitude: number, longitude: number): Promise<WeatherData> => {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données météo.");
    }

    const data = await response.json();
    return {
        temperature: data.current.temp,
        description: data.current.weather[0].description,
        city: data.timezone,
    };
};

// Fonction pour afficher les informations météo dans l'élément HTML
export const displayWeather = (weather: WeatherData): void => {
    const weatherInfo = document.getElementById("weather-info");
    if (weatherInfo) {
        weatherInfo.innerHTML = `
            <h3 class="weather-title">Météo actuelle</h3>
            <div class="weather-informations">
                <p>Vous êtes : ${weather.city}</p>
                <p>Il fait : ${weather.temperature}°C</p>
                <p>Conditions : ${weather.description}</p>
            </div>
        `;
    }
};

// Fonction pour récupérer la géolocalisation de l'utilisateur
export const getGeolocation = (): Promise<google.maps.LatLngLiteral> => {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ lat: latitude, lng: longitude });
                },
                (error) => {
                    reject("Erreur de géolocalisation : " + error.message);
                }
            );
        } else {
            reject("Géolocalisation non supportée par ce navigateur");
        }
    });
};
