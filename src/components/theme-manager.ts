export class ThemeManager {
    private prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    private themeToggleBtn: HTMLElement | null = null;

    constructor() {
        // Initialiser d'abord les styles
        this.initializeTheme();
        
        // Observer les changements dans le DOM
        this.observeDOM();
        
        // Observer les changements de préférence système
        this.watchSystemTheme();
    }

    private observeDOM() {
        // Observer les changements dans le DOM pour détecter quand le bouton est ajouté
        const observer = new MutationObserver((mutations) => {
            if (!this.themeToggleBtn) {
                this.themeToggleBtn = document.getElementById('theme-toggle');
                if (this.themeToggleBtn) {
                    console.log('Bouton de thème trouvé après changement du DOM');
                    this.setupThemeToggle();
                    this.updateToggleButton();
                }
            }
        });

        // Observer tout le document pour les changements
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    private initializeTheme() {
        // Appliquer le thème initial basé sur la préférence système
        if (this.prefersDarkScheme.matches) {
            document.documentElement.classList.add('dark');
        }
        this.applyThemeStyles();
    }

    private applyThemeStyles() {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Appliquer les styles globaux
        document.documentElement.style.setProperty('--primary-bg', isDark ? '#1a1a1a' : '#ffffff');
        document.documentElement.style.setProperty('--primary-text', isDark ? '#ffffff' : '#000000');
        document.documentElement.style.setProperty('--primary-accent', isDark ? '#8BA888' : '#CFE1CA');
        document.documentElement.style.setProperty('--secondary-accent', isDark ? '#A8B562' : '#E6F285');
        document.documentElement.style.setProperty('--nav-bg', isDark ? '#2d2d2d' : '#CFE1CA');
        document.documentElement.style.setProperty('--card-bg', isDark ? '#333333' : '#ffffff');
    }

    private setupThemeToggle() {
        if (!this.themeToggleBtn) return;

        this.themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            this.updateToggleButton();
            this.applyThemeStyles();
            this.showThemeChangeNotification(document.documentElement.classList.contains('dark'));
        });
    }

    private watchSystemTheme() {
        this.prefersDarkScheme.addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            this.updateToggleButton();
            this.applyThemeStyles();
        });
    }

    private updateToggleButton() {
        if (!this.themeToggleBtn) return;

        const isDark = document.documentElement.classList.contains('dark');
        
        this.themeToggleBtn.innerHTML = isDark ? `
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
            </svg>
        ` : `
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
        `;
    }

    private showThemeChangeNotification(isDark: boolean) {
        const notification = document.createElement('div');
        notification.className = `
            fixed bottom-4 right-4 
            ${isDark ? 'bg-gray-800 text-white' : 'bg-[#CFE1CA] text-black'} 
            px-6 py-3 rounded-lg shadow-lg 
            transition-opacity duration-300
        `;
        notification.textContent = isDark ? 'Mode sombre activé' : 'Mode clair activé';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Créer une instance unique
const themeManager = new ThemeManager();
export default themeManager;