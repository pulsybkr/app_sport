export class Router {
  private routes: Map<string, () => void>;
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

  addRoute(path: string, callback: () => void): void {
    this.routes.set(path, callback);
  }

  navigate(path: string): void {
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  private async handleRoute(): Promise<void> {
    const path = window.location.pathname;
    const callback = this.routes.get(path);
    
    if (callback) {
      this.root.innerHTML = '';
      callback();
    } else {
      const response = await fetch('./views/404.html');
      const content = await response.text();  
      this.root.innerHTML = content;
    }
  }

  init(): void {
    this.handleRoute();
  }
} 