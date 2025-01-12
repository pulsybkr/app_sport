import { activityService } from '../services/activity.service.js';
import { showToast } from '../toast.js';
// import L from 'leaflet';
import type { Activity } from '../services/activity.service.js';

class ActivityTracking {
    private activity: Activity | null = null;
    private tracking: boolean = false;
    private startTime: number = 0;
    private pausedTime: number = 0;  
    private lastPauseTime: number = 0;  
    private totalDistance: number = 0;  
    private map: L.Map | null = null;
    private plannedRoute: L.Polyline | null = null; 
    private actualRoute: L.Polyline | null = null;  
    private positions: [number, number][] = [];
    private watchId: number | null = null;
    private deviationThreshold: number = 50; 
    private updateInterval: number | null = null;
    private readonly isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    private simulationInterval: number | null = null;
    private simulatedIndex: number = 0;
    private simulationSpeed: number = 1;
    private readonly SIMULATION_INTERVAL = 1000;
    private readonly WALKING_SPEED = 5.4; // vitesse moyenne de marche en m/s (environ 5 km/h)
    private currentSimulatedPosition: [number, number] = [0, 0];
    private lastSimulationTime: number = 0;
    private prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    private themeToggleBtn: HTMLElement | null = null;
    private fullscreenBtn: HTMLElement | null = null;

    constructor() {
        this.initializeActivity();
        this.initializeFullscreenButton();
    }

    private async initializeActivity() {
        try {
            // Récupérer l'activité depuis le localStorage
            this.activity = activityService.getCurrentActivity();
            
            if (!this.activity) {
                showToast('Aucune activité en cours', 'error');
                window.location.href = '/activity';
                return;
            }

            await this.initializeMap();
            this.updateParcoursInfo();
            this.initializeEventListeners();

        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            showToast('Erreur lors de l\'initialisation', 'error');
        }
    }

    private initializeEventListeners() {
        const startButton = document.getElementById('start-activity');
        const pauseButton = document.getElementById('pause-activity');
        const stopButton = document.getElementById('stop-activity');

        if (startButton) {
            startButton.addEventListener('click', () => this.startTracking());
        }
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.pauseTracking());
        }
        if (stopButton) {
            stopButton.addEventListener('click', () => this.stopTracking());
        }

        // Ajouter les contrôles de simulation en mode développement
        if (this.isDevelopment) {
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg';
            controlsContainer.innerHTML = `
                <h3 class="text-lg font-bold mb-2">Contrôles de simulation</h3>
                <div class="flex gap-2 mb-2">
                    <button class="sim-speed" data-speed="0.5">Lent</button>
                    <button class="sim-speed" data-speed="1">Normal</button>
                    <button class="sim-speed" data-speed="1.5">Rapide</button>
                </div>
                <div class="text-sm text-gray-600">
                    Vitesse actuelle: <span id="current-sim-speed">5 km/h</span>
                </div>
            `;

            document.body.appendChild(controlsContainer);

            // Ajouter les événements aux boutons
            controlsContainer.querySelectorAll('.sim-speed').forEach(button => {
                button.addEventListener('click', (e) => {
                    const speed = parseFloat((e.target as HTMLElement).dataset.speed || '1');
                    this.setSimulationSpeed(speed);
                    
                    // Mettre à jour l'apparence des boutons
                    controlsContainer.querySelectorAll('.sim-speed').forEach(btn => {
                        btn.classList.remove('bg-blue-500', 'text-white');
                        btn.classList.add('bg-gray-200');
                    });
                    (e.target as HTMLElement).classList.remove('bg-gray-200');
                    (e.target as HTMLElement).classList.add('bg-blue-500', 'text-white');
                });
            });
        }
    }

    private async initializeMap() {
        try {
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                throw new Error('Élément map non trouvé');
            }

            this.map = L.map('map').setView([0, 0], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

            // Créer deux polylines distinctes
            this.plannedRoute = L.polyline([], { 
                color: 'blue', 
                weight: 3,
                dashArray: '5, 10' 
            }).addTo(this.map);

            this.actualRoute = L.polyline([], { 
                color: 'red',
                weight: 3
            }).addTo(this.map);

            await this.loadPlannedRoute();

            if (this.activity?.coordinates && this.activity.coordinates.length > 0) {
                this.map.setView(this.activity.coordinates[0], 15);
            } else {
                await this.centerOnCurrentPosition();
            }

        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte:', error);
            throw error;
        }
    }

    private async loadPlannedRoute() {
        if (!this.activity?.parcoursId) return;

        try {
            const parcours = JSON.parse(localStorage.getItem('parcours') || '[]')
                .find((p: any) => p.id === this.activity?.parcoursId);


            if (parcours?.points && this.plannedRoute && this.map) {
                console.log('Points du parcours:', parcours.points); // Debug
                this.plannedRoute.setLatLngs(parcours.points);
                this.map.fitBounds(this.plannedRoute.getBounds());
            }
        } catch (error) {
            console.error('Erreur lors du chargement du parcours prévu:', error);
        }
    }

    private async centerOnCurrentPosition(): Promise<void> {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (this.map) {
                        this.map.setView([latitude, longitude], 15);
                        L.marker([latitude, longitude]).addTo(this.map);
                    }
                    resolve();
                },
                (error) => {
                    console.error('Erreur de géolocalisation:', error);
                    reject(error);
                }
            );
        });
    }

    private updateParcoursInfo() {
        if (!this.activity) return;

        const parcoursName = document.getElementById('parcours-name');
        const parcoursDistance = document.getElementById('parcours-distance');
        const parcoursType = document.getElementById('parcours-type');

        if (parcoursName) {
            parcoursName.textContent = this.activity.name;
        }
        if (parcoursDistance) {
            parcoursDistance.textContent = `Distance: ${(this.activity.distance / 1000).toFixed(2)} km`;
        }
        if (parcoursType) {
            parcoursType.textContent = `Type: ${this.activity.type}`;
        }
    }

    private setSimulationSpeed(speed: number) {
        this.simulationSpeed = speed;
        if (this.simulationInterval !== null) {
            // Redémarrer la simulation avec la nouvelle vitesse
            this.stopSimulation();
            this.startSimulation();
        }
    }

    private interpolatePosition(start: [number, number], end: [number, number], fraction: number): [number, number] {
        return [
            start[0] + (end[0] - start[0]) * fraction,
            start[1] + (end[1] - start[1]) * fraction
        ];
    }

    private calculateStepSize(point1: [number, number], point2: [number, number]): number {
        // Calculer la distance en mètres entre deux points
        const R = 6371000; // Rayon de la Terre en mètres
        const dLat = this.toRad(point2[0] - point1[0]);
        const dLon = this.toRad(point2[1] - point1[1]);
        const lat1 = this.toRad(point1[0]);
        const lat2 = this.toRad(point2[0]);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private startSimulation() {
        if (!this.activity?.parcoursId) return;

        try {
            const parcours = JSON.parse(localStorage.getItem('parcours') || '[]')
                .find((p: any) => p.id === this.activity?.parcoursId);

            if (!parcours?.points || parcours.points.length === 0) {
                console.warn('Pas de points pour la simulation');
                return;
            }

            this.simulatedIndex = 0;
            this.currentSimulatedPosition = parcours.points[0];
            this.lastSimulationTime = Date.now();

            this.simulationInterval = window.setInterval(() => {
                if (this.simulatedIndex >= parcours.points.length - 1) {
                    this.stopSimulation();
                    return;
                }

                const currentPoint = parcours.points[this.simulatedIndex];
                const nextPoint = parcours.points[this.simulatedIndex + 1];
                const currentTime = Date.now();
                const deltaTime = (currentTime - this.lastSimulationTime) / 1000; // en secondes
                
                const speed = this.WALKING_SPEED * this.simulationSpeed * 
                    (0.8 + Math.random() * 0.4); 
                const distanceToMove = speed * deltaTime;
                
                const totalDistance = this.calculateStepSize(currentPoint, nextPoint);
                
                const remainingDistance = this.calculateStepSize(this.currentSimulatedPosition, nextPoint);
                
                if (remainingDistance <= distanceToMove) {
                    // Passer au point suivant
                    this.simulatedIndex++;
                    this.currentSimulatedPosition = nextPoint;
                } else {
                    // Interpoler la position
                    const fraction = distanceToMove / remainingDistance;
                    this.currentSimulatedPosition = this.interpolatePosition(
                        this.currentSimulatedPosition,
                        nextPoint,
                        fraction
                    );
                }

                const position = {
                    coords: {
                        latitude: this.currentSimulatedPosition[0],
                        longitude: this.currentSimulatedPosition[1],
                        accuracy: 5 + Math.random() * 10,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: speed
                    },
                    timestamp: currentTime,
                    toJSON: function() { return this; }
                } as GeolocationPosition;

                this.handlePositionUpdate(position);
                this.lastSimulationTime = currentTime;

            }, 200);

        } catch (error) {
            console.error('Erreur lors de la simulation:', error);
        }
    }

    private stopSimulation() {
        if (this.simulationInterval !== null) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }

    private startTracking() {
        if (this.tracking) return;

        const now = Date.now();
        
        if (this.lastPauseTime > 0) {
            this.pausedTime += now - this.lastPauseTime;
            this.lastPauseTime = 0;
        } else if (this.startTime === 0) {
            this.startTime = now;
        }

        this.tracking = true;
        this.updateButtonsState('tracking');

        if (this.isDevelopment) {
            console.log('Mode développement: démarrage de la simulation GPS');
            this.startSimulation();
        } else {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => this.handlePositionUpdate(position),
                (error) => console.error('Erreur GPS:', error),
                { enableHighAccuracy: true }
            );
        }

        this.updateInterval = window.setInterval(() => {
            this.updateStats();
        }, 1000);

        if (this.activity?.id) {
            activityService.startActivity(this.activity.id);
        }
    }

    private pauseTracking() {
        if (!this.tracking) return;
        
        this.tracking = false;
        this.lastPauseTime = Date.now();
        this.updateButtonsState('paused');
        
        if (this.isDevelopment) {
            this.stopSimulation();
        } else if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.totalDistance = this.calculateDistance();
    }

    private async stopTracking() {
        if (this.isDevelopment) {
            this.stopSimulation();
        } else if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
        }

        if (this.activity?.id) {
            const finalDuration = Date.now() - this.startTime - this.pausedTime;
            const finalStats = {
                distance: this.totalDistance + this.calculateDistance(),
                coordinates: this.positions,
                duration: finalDuration,
                calories: this.calculateCalories(this.totalDistance, finalDuration)
            };

            await activityService.completeActivity(this.activity.id);
            activityService.clearCurrentActivity();
            window.location.href = '/dashboard';
        }
    }

    private handlePositionUpdate(position: GeolocationPosition) {
        const coords: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
        ];
        
        this.positions.push(coords);
        this.updateMap(coords);
        this.checkRouteDeviation(coords);
        this.updateStats();
    }

    private updateMap(coords: [number, number]) {
        if (this.map && this.actualRoute) {
            this.actualRoute.addLatLng(coords);
            this.map.setView(coords);
        }
    }

    private checkRouteDeviation(currentPosition: [number, number]) {
        if (!this.activity?.parcoursId) return;

        try {
            const parcours = JSON.parse(localStorage.getItem('parcours') || '[]')
                .find((p: any) => p.id === this.activity?.parcoursId);

            if (!parcours?.points || !this.plannedRoute) {
                console.warn('Points du parcours non disponibles');
                return;
            }

            const closestPoint = this.findClosestPointOnRoute(currentPosition, parcours.points);
            
            const distance = this.calculateDistance([currentPosition, closestPoint]);

            console.log('Distance de déviation:', distance * 1000, 'mètres');

            if (distance * 1000 > this.deviationThreshold) {
                // showToast('Attention: Vous vous éloignez du parcours prévu!', 'warning');
                
                if (this.actualRoute) {
                    this.actualRoute.setStyle({ color: 'red' });
                }
            } else {
                if (this.actualRoute) {
                    this.actualRoute.setStyle({ color: 'green' });
                }
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de la déviation:', error);
        }
    }

    private findClosestPointOnRoute(position: [number, number], routePoints: [number, number][]): [number, number] {
        if (!routePoints || routePoints.length === 0) {
            console.warn('Aucun point de route disponible');
            return position;
        }

        let closestPoint = routePoints[0];
        let minDistance = this.calculateDistance([position, closestPoint]); // Correction ici aussi

        for (const point of routePoints) {
            const distance = this.calculateDistance([position, point]); // Et ici
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }

        return closestPoint;
    }

    private updateStats() {
        if (!this.activity?.id || !this.tracking) return;

        const currentTime = Date.now();
        const duration = currentTime - this.startTime - this.pausedTime;
        
        const currentDistance = this.calculateDistance();
        const totalDistance = this.totalDistance + currentDistance;
        const speed = this.calculateSpeed(totalDistance, duration);
        const calories = this.calculateCalories(totalDistance, duration);

        this.updateDisplay(totalDistance, duration, speed, calories);

        const currentPosition = this.positions[this.positions.length - 1];
        if (currentPosition) {
            this.updateActivityProgress(totalDistance, speed, calories);
        }

        if (this.activity.distance > 0) {
            const progress = (totalDistance / this.activity.distance) * 100;
            this.updateProgressBar(progress);
        }
    }

    private calculateDistance(points?: [number, number][]): number {
        if (points) {
            if (points.length !== 2) {
                console.warn('Nombre de points incorrect pour le calcul de distance', points);
                return 0;
            }
            return this.getDistanceBetweenPoints(points[0], points[1]);
        }

        if (this.positions.length < 2) return 0;

        let total = 0;
        for (let i = 1; i < this.positions.length; i++) {
            total += this.getDistanceBetweenPoints(this.positions[i-1], this.positions[i]);
        }
        return total;
    }

    private getDistanceBetweenPoints(p1: [number, number], p2: [number, number]): number {
        if (!p1 || !p2) {
            console.warn('Points invalides pour le calcul de distance', { p1, p2 });
            return 0;
        }

        try {
            const R = 6371; 
            const dLat = this.toRad(p2[0] - p1[0]);
            const dLon = this.toRad(p2[1] - p1[1]);
            const lat1 = this.toRad(p1[0]);
            const lat2 = this.toRad(p2[0]);

            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        } catch (error) {
            console.error('Erreur dans le calcul de distance:', error);
            return 0;
        }
    }

    private toRad(value: number): number {
        return value * Math.PI / 180;
    }

    private calculateSpeed(distance: number, duration: number): number {
        return (distance / (duration / 3600000));
    }

    private calculateCalories(distance: number, duration: number): number {
        const hours = duration / 3600000;
        const MET = this.activity?.type === 'course' ? 8 : 4;
        const weight = 70;
        return MET * weight * hours;
    }

    private updateDisplay(distance: number, duration: number, speed: number, calories: number) {
        requestAnimationFrame(() => {
            const distanceElement = document.getElementById('current-distance');
            const durationElement = document.getElementById('current-duration');
            const speedElement = document.getElementById('current-speed');
            const caloriesElement = document.getElementById('calories-burned');

            if (distanceElement) distanceElement.textContent = `${distance.toFixed(2)} km`;
            if (durationElement) durationElement.textContent = this.formatDuration(duration);
            if (speedElement) speedElement.textContent = `${speed.toFixed(1)} km/h`;
            if (caloriesElement) caloriesElement.textContent = `${Math.round(calories)} kcal`;
        });
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    private updateButtonsState(state: 'initial' | 'tracking' | 'paused') {
        const startButton = document.getElementById('start-activity');
        const pauseButton = document.getElementById('pause-activity');
        const stopButton = document.getElementById('stop-activity');

        if (startButton && pauseButton && stopButton) {
            switch (state) {
                case 'initial':
                    startButton.classList.remove('hidden');
                    pauseButton.classList.add('hidden');
                    stopButton.classList.add('hidden');
                    break;
                case 'tracking':
                    startButton.classList.add('hidden');
                    pauseButton.classList.remove('hidden');
                    stopButton.classList.remove('hidden');
                    break;
                case 'paused':
                    startButton.classList.remove('hidden');
                    pauseButton.classList.add('hidden');
                    stopButton.classList.remove('hidden');
                    break;
            }
        }
    }

    private async updateActivityProgress(distance: number, speed: number, calories: number) {
        if (!this.activity?.id) return;

        const currentPosition = this.positions[this.positions.length - 1];
        await activityService.updateActivityProgress(this.activity.id, {
            currentPosition,
            currentSpeed: speed,
            distance,
            calories
        });
    }

    private updateProgressBar(progress: number) {
        requestAnimationFrame(() => {
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = `${Math.min(100, progress)}%`;
                progressBar.setAttribute('aria-valuenow', progress.toString());
            }
        });
    }

    private initializeFullscreenButton() {
        // Créer le bouton de plein écran
        const header = document.getElementById('activity-header');
        if (!header) return;

        const buttonContainer = header.querySelector('.flex.gap-2');
        if (!buttonContainer) return;

        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.className = 'bg-[#CFE1CA] hover:bg-[#E6F285] text-black px-4 md:px-6 py-2 rounded-lg flex-1 md:flex-none transition-colors duration-200';
        this.fullscreenBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
        `;
        this.fullscreenBtn.setAttribute('aria-label', 'Mode plein écran');

        // Ajouter l'événement click
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // Ajouter le bouton au conteneur
        buttonContainer.insertBefore(this.fullscreenBtn, buttonContainer.firstChild);

        // Écouter les changements d'état du plein écran
        document.addEventListener('fullscreenchange', () => this.updateFullscreenButton());
    }

    private toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Passer en plein écran
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Erreur lors du passage en plein écran : ${err.message}`);
            });
        } else {
            // Quitter le plein écran
            document.exitFullscreen().catch(err => {
                console.error(`Erreur lors de la sortie du plein écran : ${err.message}`);
            });
        }
    }

    private updateFullscreenButton() {
        if (!this.fullscreenBtn) return;

        const isFullscreen = !!document.fullscreenElement;
        
        this.fullscreenBtn.innerHTML = isFullscreen ? `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        ` : `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
        `;
    }
}

new ActivityTracking(); 

const style = document.createElement('style');
style.textContent = `
    .sim-speed {
        padding: 4px 8px;
        border-radius: 4px;
        background-color: #e5e7eb;
        cursor: pointer;
        transition: all 0.3s;
    }
    .sim-speed:hover {
        background-color: #d1d5db;
    }
`;
document.head.appendChild(style); 