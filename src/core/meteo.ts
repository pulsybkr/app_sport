// Fonction pour récupérer la météo

async function getWeather(latitude: number, longitude: number) {
    const apiKey = "8b88011db31a2ab1d20e412898eff202"
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    try {
        // Récupérer la météo actuelle
        const response = await fetch(currentWeatherUrl);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données météo actuelle');
        }
        const currentData = await response.json();
        
        // Afficher la météo actuelle dans le HTML avec icône
        const currentWeatherElement = document.getElementById('current-weather');
        if (currentWeatherElement) {
            currentWeatherElement.innerHTML = `
                <div class="flex flex-col items-center">
                    <h2 class="text-3xl font-bold">il fais</h2>
                    <h3 class="font-bold">actuellement</h3>
                    <h2 class="font-bold text-4xl">${Math.round(currentData.main.temp)}°C</h2>
                </div>
            `;
        }

        // Récupérer les prévisions
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            throw new Error('Erreur lors de la récupération des prévisions météo');
        }
        const forecastData = await forecastResponse.json();
        
        // Filtrer pour avoir une prévision par jour (à midi)
        const dailyForecasts = forecastData.list.filter((forecast: any) => 
            forecast.dt_txt.includes('12:00:00')
        ).slice(0, 4);

        // Afficher les prévisions dans le HTML
        const forecastHtml = dailyForecasts.map((forecast: any) => `
            <div class="bg-[#CFE1CA] p-6 rounded-2xl flex flex-col items-center">
                <p class="font-semibold">${new Date(forecast.dt * 1000).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })}</p>
                <div class="flex items-center gap-2">
                    <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" 
                         alt="${forecast.weather[0].description}"
                         class="w-12 h-12">
                    <div>
                        <p class="text-sm">
                            Min: ${Math.round(forecast.main.temp_min)}°C
                        </p>
                        <p class="text-sm">
                            Max: ${Math.round(forecast.main.temp_max)}°C
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
        
        const forecastElement = document.getElementById('forecast');
        if (forecastElement) {
            forecastElement.innerHTML = `
                <div class="">
                    <h2 class="text-2xl font-bold mb-4">Méteo des prochains jours</h2>
                    <div class="grid grid-cols-4 gap-4">
                        ${forecastHtml}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exemple d'utilisation avec la géolocalisation
navigator.geolocation.getCurrentPosition(
    (position) => {
        const { latitude, longitude } = position.coords;
        getWeather(latitude, longitude);
    },
    (error) => {
        console.error('Erreur de géolocalisation:', error);
    }
);