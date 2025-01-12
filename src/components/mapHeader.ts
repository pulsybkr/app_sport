setTimeout(() => {
    const mapElement = document.getElementById('map');
    
    if (mapElement) {
        var map = L.map('map');

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

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
    }
}, 100);
