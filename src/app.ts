import { Router } from './core/Router.js';
import { activityService } from './services/activity.service.js';
// import L from 'leaflet';
let router: Router;

const initializeApp = (): void => {
  const root = document.getElementById('app');
  if (!root) throw new Error("Element 'app' non trouvé");

  router = new Router(root);
  initializeRoutes();
};

export const loadView = async (viewPath: string): Promise<string> => {
  const response = await fetch(viewPath);
  return await response.text();
};

const loadHeaderAndView = async (viewPath: string): Promise<void> => {
  const headerContent = await loadView('./views/header.html');
  const content = await loadView(viewPath);
  document.getElementById('app')!.innerHTML = headerContent + content;
};

const initializeRoutes = async (): Promise<void> => {
  router.addRoute('/', async () => {
    await loadHeaderAndView('./views/home.html');
  });

  router.addRoute('/about', async () => {
    await loadHeaderAndView('./views/about.html');
  });

  router.addRoute('/login', async () => {
    const content = await loadView('./views/login.html');
    document.getElementById('app')!.innerHTML = content;
    loadPageScript('../dist/auth/login.js');
  });

  router.addRoute('/register', async () => {
    const content = await loadView('./views/register.html');
    document.getElementById('app')!.innerHTML = content;
    loadPageScript('../dist/auth/register.js');
  });

  router.addRoute('/dashboard', async () => {
    const content = await loadView('./views/dashboard/dashboard.html');
    const header = await loadView('./views/dashboard/components/header.html');
    document.getElementById('app')!.innerHTML = header + content;
    // loadPageScript('../dist/auth/middleware.js');
    loadPageScript('../dist/components/mapHeader.js');
    loadPageScript('../dist/core/meteo.js');
  });

  router.addRoute('/activity', async () => {
    try {
      const content = await loadView('./views/dashboard/activity.html');
      const header = await loadView('./views/dashboard/components/header.html');

      document.getElementById('app')!.innerHTML = header + content;

      await Promise.all([
        loadPageScript('../dist/auth/middleware.js'),
        loadPageScript('../dist/components/parcours.js')
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement de la page activity:', error);
    }
  });

  router.addRoute('/app', async () => {
    try {
        const content = await loadView('./views/dashboard/activity-details.html');
        const header = await loadView('./views/dashboard/components/header.html');
        document.getElementById('app')!.innerHTML = header + content;

        await Promise.all([
            loadPageScript('../dist/auth/middleware.js'),
            loadPageScript('../dist/components/activity-tracking.js')
        ]);
    } catch (error) {
        console.error('Erreur lors du chargement de la page activity:', error);
    }

    
  });

router.addRoute('/profile', async () => {
  try {
    const content = await loadView('./views/dashboard/profile.html');
    const header = await loadView('./views/dashboard/components/header.html');
    document.getElementById('app')!.innerHTML = header + content;

    await Promise.all([
        loadPageScript('../dist/auth/middleware.js'),
        loadPageScript('../dist/components/profile.js'),
        loadPageScript('../dist/components/share-copy.js')
    ]);
  } catch (error) {
    console.error('Erreur lors du chargement de la page profile:', error);
    }
  });
};

const loadPageScript = (scriptPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptPath;
    script.type = 'module';
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
};

// Démarrage de l'application
const startApp = (): void => {
  router.init();
};

// Écouteur d'événement pour le chargement du DOM
window.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  startApp();
});