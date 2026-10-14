export type SmoothedCoordinate = {
  latitude: number;
  longitude: number;
  accuracyM: number;
};

/**
 * 1D recursive Kalman-inspired filter for coordinate noise reduction.
 * Dampens single-sample GPS drift spikes in indoor venues, malls, and high-rise areas.
 */
export class CoordinateFilter {
  private lat: number | null = null;
  private lng: number | null = null;
  private variance = -1;
  private readonly processNoise: number;

  constructor(processNoise = 1e-5) {
    this.processNoise = processNoise;
  }

  reset(): void {
    this.lat = null;
    this.lng = null;
    this.variance = -1;
  }

  update(
    latitude: number,
    longitude: number,
    accuracyM: number,
  ): SmoothedCoordinate {
    const measurementVariance = Math.max(accuracyM * accuracyM, 1);

    if (this.lat === null || this.lng === null || this.variance < 0) {
      this.lat = latitude;
      this.lng = longitude;
      this.variance = measurementVariance;
      return { latitude, longitude, accuracyM };
    }

    // Prediction step: increase variance by expected motion noise
    this.variance += this.processNoise;

    // Kalman gain: weight between previous estimate and new measurement
    const k = this.variance / (this.variance + measurementVariance);
    this.lat += k * (latitude - this.lat);
    this.lng += k * (longitude - this.lng);
    this.variance = (1 - k) * this.variance;

    return {
      latitude: this.lat,
      longitude: this.lng,
      accuracyM: Math.round(Math.sqrt(this.variance) * 10) / 10,
    };
  }
}
