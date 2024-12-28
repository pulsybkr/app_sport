import { Component } from '../core/Component.js';

export class Header extends Component {
  constructor() {
    super('header');
  }

  render(): void {
    this.setContent(`
      <nav class="bg-gray-800 text-white p-4">
        <ul class="flex space-x-4">
          <li><a href="/" class="hover:text-gray-300">Accueil</a></li>
          <li><a href="/about" class="hover:text-gray-300">À propos</a></li>
        </ul>
      </nav>
    `);
  }
} 