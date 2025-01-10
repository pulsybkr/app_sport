import { userService } from '../services/user.service.js';
import { activityService } from '../services/activity.service.js';
import { showToast } from '../toast.js';

class ProfileManager {
    private modals: {[key: string]: HTMLElement} = {};
    private mediaStream: MediaStream | null = null;
    private charts: {[key: string]: any} = {};

    constructor() {
        this.initializeModals();
        this.loadUserData();
        this.loadUserStats();
        this.initializeEventListeners();
    }

    private initializeModals() {
        this.modals = {
            editProfile: document.getElementById('edit-profile-modal') as HTMLElement,
            changePassword: document.getElementById('change-password-modal') as HTMLElement
        };

        const logout = document.getElementById('logout') as HTMLElement;
        logout.addEventListener('click', () => {
            userService.logout();
        });

        // Ajouter les gestionnaires pour fermer les modals
        document.querySelectorAll('.cancel-modal').forEach(button => {
            button.addEventListener('click', () => this.closeAllModals());
        });

        // Fermer les modals en cliquant en dehors
        window.addEventListener('click', (e) => {
            Object.values(this.modals).forEach(modal => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
    }

    private async loadUserData() {
        try {
            const user = await userService.getCurrentUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }

            // console.log(user);
            // Mettre à jour les informations utilisateur
            const userNameElement = document.getElementById('user-name');
            const userEmailElement = document.getElementById('user-email');
            const profileImage = document.getElementById('profile-image') as HTMLImageElement;

            if (userNameElement) userNameElement.textContent = user.firstname;
            if (userEmailElement) userEmailElement.textContent = user.email;
            if (profileImage && user.profile_picture) {
                profileImage.src = user.profile_picture;
            }

            // Pré-remplir le formulaire de modification
            const editNameInput = document.getElementById('edit-name') as HTMLInputElement;
            const editEmailInput = document.getElementById('edit-email') as HTMLInputElement;
            
            if (editNameInput) editNameInput.value = user.firstname;
            if (editEmailInput) editEmailInput.value = user.email;

        } catch (error) {
            console.error('Erreur lors du chargement des données utilisateur:', error);
            showToast('Erreur lors du chargement des données', 'error');
        }
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    private async loadUserStats() {
        try {
            const user = await userService.getCurrentUser();
            if (!user || !user.id) return;

            const activities = await activityService.getUserActivities(user.id);
            
            // Calculer les statistiques
            const totalActivities = activities.length;
            const totalDistance = activities.reduce((sum, act) => sum + (act.currentDistance || 0), 0);
            const totalTime = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
            const totalCalories = activities.reduce((sum, act) => sum + (act.calories || 0), 0);

            // Mettre à jour l'affichage
            const elements = {
                totalActivities: document.getElementById('total-activities'),
                totalDistance: document.getElementById('total-distance'),
                totalTime: document.getElementById('total-time'),
                totalCalories: document.getElementById('total-calories')
            };

            if (elements.totalActivities) elements.totalActivities.textContent = totalActivities.toString();
            if (elements.totalDistance) elements.totalDistance.textContent = `${totalDistance.toFixed(2)} km`;
            if (elements.totalTime) elements.totalTime.textContent = this.formatDuration(totalTime);
            if (elements.totalCalories) elements.totalCalories.textContent = `${Math.round(totalCalories)} kcal`;

            // Créer les graphiques
            this.createActivityChart(activities);
            this.createDistanceChart(activities);
            this.displayRecentActivities(activities);

        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
            showToast('Erreur lors du chargement des statistiques', 'error');
        }
    }

    private createActivityChart(activities: any[]) {
        const ctx = document.getElementById('activities-chart') as HTMLCanvasElement;
        if (!ctx) return;

        // Grouper les activités par semaine
        const weeklyData = this.groupActivitiesByWeek(activities);

        if (this.charts['activities']) {
            this.charts['activities'].destroy();
        }

        this.charts['activities'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [{
                    label: 'Activités par semaine',
                    data: weeklyData.data,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    private createDistanceChart(activities: any[]) {
        const ctx = document.getElementById('distance-chart') as HTMLCanvasElement;
        if (!ctx) return;

        // Trier les activités par date
        const sortedActivities = activities
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-10); // Prendre les 10 dernières activités

        if (this.charts['distance']) {
            this.charts['distance'].destroy();
        }

        this.charts['distance'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedActivities.map(a => new Date(a.date).toLocaleDateString()),
                datasets: [{
                    label: 'Distance (km)',
                    data: sortedActivities.map(a => a.currentDistance || 0),
                    borderColor: 'rgb(59, 130, 246)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    private groupActivitiesByWeek(activities: any[]) {
        const weeks: { [key: string]: number } = {};
        
        activities.forEach(activity => {
            const date = new Date(activity.date);
            const weekKey = this.getWeekKey(date);
            weeks[weekKey] = (weeks[weekKey] || 0) + 1;
        });

        // Prendre les 6 dernières semaines
        const sortedWeeks = Object.entries(weeks)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6);

        return {
            labels: sortedWeeks.map(([week]) => week),
            data: sortedWeeks.map(([, count]) => count)
        };
    }

    private getWeekKey(date: Date): string {
        const year = date.getFullYear();
        const weekNumber = this.getWeekNumber(date);
        return `S${weekNumber} ${year}`;
    }

    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    private displayRecentActivities(activities: any[]) {
        const container = document.getElementById('recent-activities');
        if (!container) return;

        const recentActivities = activities
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        container.innerHTML = recentActivities.map(activity => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <div class="font-semibold">${new Date(activity.date).toLocaleDateString()}</div>
                    <div class="text-sm text-gray-600">Distance: ${activity.currentDistance?.toFixed(2)} km</div>
                </div>
                <div class="text-right">
                    <div class="text-sm">${this.formatDuration(activity.duration)}</div>
                    <div class="text-sm text-gray-600">${Math.round(activity.calories)} kcal</div>
                </div>
            </div>
        `).join('');
    }

    private initializeEventListeners() {
        const editProfileBtn = document.getElementById('edit-profile');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.showModal('editProfile'));
        }

        const changePasswordBtn = document.getElementById('change-password');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.showModal('changePassword'));
        }

        const changePhotoBtn = document.getElementById('change-photo');
        if (changePhotoBtn) {
            changePhotoBtn.addEventListener('click', () => this.startCamera());
        }

        const editProfileForm = document.getElementById('edit-profile-form');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        const changePasswordForm = document.getElementById('change-password-form');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
    }

    private async startCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            const cameraModal = document.createElement('div');
            cameraModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
            cameraModal.innerHTML = `
                <div class="bg-white rounded-lg p-6">
                    <video id="camera-preview" autoplay playsinline class="mb-4 rounded-lg"></video>
                    <div class="flex justify-center space-x-4">
                        <button id="take-photo" class="bg-blue-500 text-white px-4 py-2 rounded-lg">
                            Prendre la photo
                        </button>
                        <button id="cancel-photo" class="bg-gray-500 text-white px-4 py-2 rounded-lg">
                            Annuler
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(cameraModal);

            const video = document.getElementById('camera-preview') as HTMLVideoElement;
            if (video) {
                video.srcObject = this.mediaStream;
            }

            // Gestionnaires d'événements pour la caméra
            document.getElementById('take-photo')?.addEventListener('click', () => this.capturePhoto());
            document.getElementById('cancel-photo')?.addEventListener('click', () => this.stopCamera());

        } catch (error) {
            console.error('Erreur lors de l\'accès à la caméra:', error);
            showToast('Impossible d\'accéder à la caméra', 'error');
        }
    }

    private async capturePhoto() {
        const video = document.getElementById('camera-preview') as HTMLVideoElement;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0);
            const photoData = canvas.toDataURL('image/jpeg');
            
            try {
                const currentUser = await userService.getCurrentUser();
                if (!currentUser) {
                    throw new Error('Utilisateur non connecté');
                }

                // Mettre à jour la photo de profil
                await userService.updateProfile({
                    ...currentUser,
                    profileImage: photoData
                });

                // Mettre à jour l'affichage
                const profileImage = document.getElementById('profile-image') as HTMLImageElement;
                if (profileImage) {
                    profileImage.src = photoData;
                }

                this.stopCamera();
                showToast('Photo de profil mise à jour', 'success');
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la photo:', error);
                showToast('Erreur lors de la mise à jour de la photo', 'error');
            }
        }
    }

    private stopCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        const cameraModal = document.querySelector('[id^="camera-preview"]')?.closest('.fixed');
        if (cameraModal) {
            cameraModal.remove();
        }
    }

    private async handleProfileUpdate(e: Event) {
        e.preventDefault();
        const nameInput = document.getElementById('edit-name') as HTMLInputElement;
        const emailInput = document.getElementById('edit-email') as HTMLInputElement;

        try {
            await userService.updateProfile({
                name: nameInput.value,
                email: emailInput.value
            });
            
            this.closeAllModals();
            await this.loadUserData();
            showToast('Profil mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            showToast('Erreur lors de la mise à jour du profil', 'error');
        }
    }

    private async handlePasswordChange(e: Event) {
        e.preventDefault();
        const oldPassword = (document.getElementById('old-password') as HTMLInputElement).value;
        const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

        if (newPassword !== confirmPassword) {
            showToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        try {
            await userService.updatePassword(oldPassword, newPassword);
            this.closeAllModals();
            showToast('Mot de passe mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            showToast('Erreur lors du changement de mot de passe', 'error');
        }
    }

    private showModal(modalName: string) {
        this.closeAllModals();
        const modal = this.modals[modalName];
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    private closeAllModals() {
        Object.values(this.modals).forEach(modal => {
            modal.classList.add('hidden');
        });
    }

}

new ProfileManager(); 