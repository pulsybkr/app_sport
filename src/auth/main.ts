import { getWeather, displayWeather } from "./weather.js";

// GeolocationService adapté pour une utilisation asynchrone
class GeolocationService {
  private location: MyLocation = null;
  private error: string | null = null;

  constructor() {
    this.getLocation();
  }

  private getLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          this.error = null;
        },
        (err) => {
          this.error = "Unable to fetch location. Please enable location services. " + err.message;
        },
        { enableHighAccuracy: true }
      );
    } else {
      this.error = "Geolocation is not supported by your browser.";
    }
  }

  public async getLocationData(): Promise<MyLocation> {
    return new Promise((resolve, reject) => {
      const checkLocation = setInterval(() => {
        if (this.location) {
          clearInterval(checkLocation);
          resolve(this.location);
        } else if (this.error) {
          clearInterval(checkLocation);
          reject(new Error(this.error));
        }
      }, 100); // Vérifie toutes les 100ms si la localisation est définie
    });
  }

  public getError(): string | null {
    return this.error;
  }
}

const main = async () => {
    
};

main();
