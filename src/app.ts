import { Router } from './core/Router.js';
// Création du router comme une variable globale
let router: Router;

// Initialisation de l'application
const initializeApp = (): void => {
  const root = document.getElementById('app');
  if (!root) throw new Error("Element 'app' non trouvé");

  router = new Router(root);
  initializeRoutes();
};

// // Configuration des routes
const initializeRoutes = async (): Promise<void> => {
  router.addRoute('/', async () => {
    const headerResponse = await fetch('./views/header.html');
    const headerContent = await headerResponse.text();
    document.getElementById('app')!.innerHTML = headerContent;
    
    const response = await fetch('./views/home.html');
    const content = await response.text();
    document.getElementById('app')!.innerHTML += content;
  });

  router.addRoute('/about', async () => {
    const headerResponse = await fetch('./views/header.html');
    const headerContent = await headerResponse.text();
    document.getElementById('app')!.innerHTML = headerContent;
    
    const response = await fetch('./views/about.html');
    const content = await response.text();
    document.getElementById('app')!.innerHTML += content;
  });

  router.addRoute('/login', async () => {
    const response = await fetch('./views/login.html');
    const content = await response.text();
    document.getElementById('app')!.innerHTML = content;
    
    loadPageScript('../dist/auth/login.js');
  });

  router.addRoute('/register', async () => {
    const response = await fetch('./views/register.html');
    const content = await response.text();
    document.getElementById('app')!.innerHTML = content;
    
    loadPageScript('../dist/auth/register.js');
  });

  router.addRoute('/dashboard', async () => {
    const response = await fetch('./views/dashboard/dashboard.html');
    const content = await response.text();
    document.getElementById('app')!.innerHTML = content;
    
    // loadPageScript('../dist/dashboard/dashboard.js');
  });
};


const loadPageScript = (scriptPath: string): void => {
    const script = document.createElement('script');
    script.src = scriptPath;
    script.type = 'module';
    document.body.appendChild(script);
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