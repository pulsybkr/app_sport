# WeatherApp - Application de Sport en Extérieur

## 📝 Description
WeatherApp est une application web moderne dédiée aux activités sportives en extérieur. Elle combine plusieurs fonctionnalités essentielles pour permettre aux utilisateurs de planifier, suivre et partager leurs activités sportives tout en prenant en compte les conditions météorologiques en temps réel.

## 🚀 Fonctionnalités principales

### 🗺️ Gestion des parcours
- Création de parcours personnalisés
- Visualisation sur carte interactive
- Suivi GPS en temps réel
- Calcul de distance et statistiques

### 🌤️ Intégration météo
- Affichage de la météo en temps réel
- Localisation automatique
- Recommandations d'activités selon la météo

### 👤 Gestion de profil
- Système d'authentification complet
- Personnalisation du profil
- Upload de photo de profil
- Historique des activités

### 📊 Statistiques et partage
- Visualisation des performances
- Graphiques détaillés
- Partage sur réseaux sociaux
- Export des données

## 🛠️ Technologies utilisées

### Web APIs
- Geolocation API
- Web Share API
- Clipboard API
- Fullscreen API
- Web Crypto API
- LocalStorage
- IndexedDB
- File API (pour les photos)
- Cookie API
- Prefers-color-scheme Media Query

### Bibliothèques externes
- Leaflet.js (cartographie)
- Chart.js (graphiques)

### Architecture
- Routing personnalisé
- Structure MVC
- Gestion modulaire des composants
- Séparation vue/logique

## 🚨 Problèmes connus
Il existe actuellement des conflits d'importation avec Chart.js et Leaflet.js :
- Les imports ES6 génèrent des erreurs dans la console
- Solution temporaire : commenter les imports pour l'affichage
- Les fonctionnalités restent opérationnelles malgré les erreurs

