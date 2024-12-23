type MyLocation = {
    latitude: number;
    longitude: number;
  } | null;
  
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
  
    public getLocationData(): MyLocation {
      return this.location;
    }
  
    public getError(): string | null {
      return this.error;
    }
  }
  
  // Exemple d'utilisation
  const geolocationService = new GeolocationService();
  
  // Récupérer la position après un certain délai (par exemple, 2 secondes)
  setTimeout(() => {
    const location = geolocationService.getLocationData();
    const error = geolocationService.getError();
  
    if (error) {
      console.log("Erreur:", error);
    } else if (location) {
      console.log("Position actuelle:", location);
    }
  }, 2000);
  