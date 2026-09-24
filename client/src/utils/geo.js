/**
 * Geolocation Utility for Student Proctoring & Verification
 * Captures browser GPS location with high accuracy, generates Google Maps links,
 * and resolves readable area addresses.
 */

let cachedLocation = null;
let lastLocationFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

export async function getClientLocation(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedLocation && (now - lastLocationFetchTime < CACHE_TTL_MS)) {
    return cachedLocation;
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          const lat = parseFloat(latitude.toFixed(6));
          const lng = parseFloat(longitude.toFixed(6));
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

          let address = null;
          try {
            // Quick non-blocking reverse geocode to get readable locality/city
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
              { signal: controller.signal, headers: { Accept: 'application/json' } }
            ).catch(() => null);
            clearTimeout(timeoutId);

            if (res && res.ok) {
              const data = await res.json();
              address = data.display_name || null;
            }
          } catch (geoErr) {
            // Non-critical fallback
          }

          const locObj = {
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(accuracy || 0),
            maps_url: mapsUrl,
            address: address
          };

          cachedLocation = locObj;
          lastLocationFetchTime = Date.now();
          resolve(locObj);
        } catch (e) {
          resolve(null);
        }
      },
      (err) => {
        // Fallback gracefully if user denies permission or device lacks GPS
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 30000
      }
    );
  });
}

