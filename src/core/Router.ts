export class Router {
  private routes: Map<string, (params?: any) => void>;
  private root: HTMLElement;

  constructor(rootElement: HTMLElement) {
    this.routes = new Map();
    this.root = rootElement;
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Ajout des gestion des clics sur les liens
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = target.getAttribute('href');
        if (href) this.navigate(href);
      }
    });
  }

  addRoute(path: string, callback: (params?: any) => void): void {
    this.routes.set(path, callback);
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  private matchRoute(pattern: string, path: string): { match: boolean, params?: any } {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return { match: false };
    }

    const params: { [key: string]: string } = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        // C'est un paramètre dynamique
        const paramName = patternParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        // Les parties statiques ne correspondent pas
        return { match: false };
      }
    }

    return { match: true, params };
  }

  private async handleRoute(): Promise<void> {
    const path = window.location.pathname;
    
    for (const [pattern, callback] of this.routes.entries()) {
        const { match, params } = this.matchRoute(pattern, path);
        
        if (match) {
            this.root.innerHTML = '';
            try {
                await callback(params);
                return;
            } catch (error) {
                console.error('Error in route callback:', error);
            }
        }
    }

    // Si aucune route ne correspond, afficher la page 404
    const response = await fetch('./views/404.html');
    const content = await response.text();  
    this.root.innerHTML = content;
  }

  init(): void {
    this.handleRoute();
  }
} 