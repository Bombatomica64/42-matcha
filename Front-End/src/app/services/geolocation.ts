import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class Geolocation {

  async getLocation(options?: PositionOptions): Promise<{ ip: string; location: { latitude: number; longitude: number } }> {
    return new Promise(async (resolve, reject) => {
      if (!navigator.geolocation) {
        try {
          const ipLocation = await this.getIpLocation();
          return resolve(ipLocation);
        } catch (error) {
          return reject(new Error('Geolocation and IP-based location failed.')); 
        }
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve({
          ip: 'unknown',
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        }),
        async error => {
          try {
            const ipLocation = await this.getIpLocation();
            return resolve(ipLocation);
          } catch (ipError) {
            return reject(new Error('Geolocation and IP-based location failed.'));
          }
        },
        options
      );
    });
  }

  private async getIpLocation(): Promise<{ ip: string; location: { latitude: number; longitude: number } }> {
    const response = await axios.get('https://ipapi.co/json/');
    return {
      ip: response.data.ip,
      location: {
        latitude: response.data.latitude,
        longitude: response.data.longitude
      }
    };
  }
}
