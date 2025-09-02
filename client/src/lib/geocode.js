export const geocodeCache = new Map();

export async function reverseGeocode(lat, lon) {
	const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
	if (geocodeCache.has(key)) return geocodeCache.get(key);
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
		const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'EMS/1.0 (reverse-geocode)' } });
		if (!res.ok) throw new Error('geocode failed');
		const data = await res.json();
		const addr = data.address || {};
		const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state || addr.country || 'Unknown';
		geocodeCache.set(key, city);
		return city;
	} catch {
		return 'Unknown';
	}
}