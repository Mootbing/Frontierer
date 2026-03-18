export const cityCoords: Record<string, [number, number]> = {
  "Aguadilla": [18.4974, -67.1456],
  "Atlanta, GA": [33.7490, -84.3880],
  "Austin, TX": [30.2672, -97.7431],
  "Baltimore, MD": [39.2904, -76.6122],
  "Bentonville/Fayetteville, AR": [36.3729, -94.2088],
  "Boise, ID": [43.6150, -116.2023],
  "Boston, MA": [42.3601, -71.0589],
  "Buffalo, NY": [42.8864, -78.8784],
  "Burbank": [34.1808, -118.3090],
  "Cabo San Lucas": [22.8905, -109.9167],
  "Cancun, MX": [21.1619, -86.8515],
  "Cedar Rapids, IA": [41.9779, -91.6656],
  "Charleston, SC": [32.7765, -79.9311],
  "Charlotte, NC": [35.2271, -80.8431],
  "Chicago, IL": [41.8781, -87.6298],
  "Cincinnati, OH": [39.1031, -84.5120],
  "Cleveland, OH": [41.4993, -81.6944],
  "Columbus, OH": [39.9612, -82.9988],
  "Corpus Christi": [27.8006, -97.3964],
  "Dallas, TX": [32.7767, -96.7970],
  "Denver, CO": [39.7392, -104.9903],
  "Des Moines, IA": [41.5868, -93.6250],
  "Detroit, MI": [42.3314, -83.0458],
  "El Paso, TX": [31.7619, -106.4850],
  "Fargo, ND": [46.8772, -96.7898],
  "Fort Lauderdale, FL": [26.1224, -80.1373],
  "Fort Myers, FL": [26.6406, -81.8723],
  "Grand Rapids, MI": [42.9634, -85.6681],
  "Guatemala City": [14.6349, -90.5069],
  "Harrisburg, PA": [40.2732, -76.8867],
  "Hartford, CT": [41.7658, -72.6851],
  "Houston, TX": [29.7604, -95.3698],
  "Indianapolis, IN": [39.7684, -86.1581],
  "Islip, NY": [40.7282, -73.2129],
  "Jacksonville, FL": [30.3322, -81.6557],
  "Kansas City, MO": [39.0997, -94.5786],
  "Knoxville, TN": [35.9606, -83.9207],
  "Las Vegas, NV": [36.1699, -115.1398],
  "Little Rock, AR": [34.7465, -92.2896],
  "Los Angeles, CA": [34.0522, -118.2437],
  "Madison, WI": [43.0731, -89.4012],
  "Memphis, TN": [35.1495, -90.0490],
  "Miami, FL": [25.7617, -80.1918],
  "Milwaukee, WI": [43.0389, -87.9065],
  "Minneapolis/St. Paul, MN": [44.9778, -93.2650],
  "Montego Bay, Jamaica": [18.4762, -77.8939],
  "Myrtle Beach, SC": [33.6891, -78.8867],
  "Nashville, TN": [36.1627, -86.7816],
  "Nassau": [25.0480, -77.3561],
  "New Orleans, LA": [29.9511, -90.0715],
  "New York City, NY": [40.7128, -74.0060],
  "Newark, NJ": [40.7357, -74.1724],
  "Norfolk, VA": [36.8508, -76.2859],
  "Oklahoma City, OK": [35.4676, -97.5164],
  "Omaha, NE": [41.2565, -95.9345],
  "Ontario/LA, CA": [34.0633, -117.6509],
  "Oranjestad, Aruba": [12.5211, -70.0270],
  "Orlando, FL": [28.5383, -81.3792],
  "Pensacola, FL": [30.4213, -87.2169],
  "Philadelphia, PA": [39.9526, -75.1652],
  "Phoenix, AZ": [33.4484, -112.0740],
  "Pittsburgh, PA": [40.4406, -79.9959],
  "Ponce": [18.0111, -66.6141],
  "Portland, OR": [45.5051, -122.6750],
  "Providenciales": [21.7742, -72.2656],
  "Puerto Vallarta, Mexico": [20.6534, -105.2253],
  "Punta Cana, Dominican Republic": [18.5601, -68.3725],
  "Raleigh, NC": [35.7796, -78.6382],
  "Reno, NV": [39.5296, -119.8138],
  "Richmond": [37.5407, -77.4360],
  "Sacramento, CA": [38.5816, -121.4944],
  "Salt Lake City, UT": [40.7608, -111.8910],
  "San Antonio, TX": [29.4241, -98.4936],
  "San Diego, CA": [32.7157, -117.1611],
  "San Francisco, CA": [37.7749, -122.4194],
  "San Jose, CA": [37.3382, -121.8863],
  "San Jose, CR": [9.9281, -84.0907],
  "San Juan, PR": [18.4655, -66.1057],
  "San Pedro Sula": [15.5000, -88.0167],
  "San Salvador": [13.6929, -89.2182],
  "Santa Ana, CA": [33.7455, -117.8677],
  "Santiago de los Caballeros": [19.4517, -70.6970],
  "Santo Domingo": [18.4861, -69.9312],
  "Sarasota, FL": [27.3364, -82.5307],
  "Seattle, WA": [47.6062, -122.3321],
  "Sioux Falls, SD": [43.5460, -96.7313],
  "Spokane, WA": [47.6587, -117.4260],
  "St. Louis, MO": [38.6270, -90.1994],
  "St. Maarten": [18.0425, -63.0548],
  "Syracuse, NY": [43.0481, -76.1474],
  "Tampa, FL": [27.9506, -82.4572],
  "Trenton, NJ": [40.2171, -74.7429],
  "Tucson, AZ": [32.2226, -110.9747],
  "Tulsa, OK": [36.1540, -95.9928],
  "Washington, D.C.": [38.9072, -77.0369],
  "West Palm Beach, FL": [26.7153, -80.0534],
};

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortCitiesByProximity(
  cities: string[],
  userLat: number,
  userLon: number,
  topN = 5
): { nearest: string[]; rest: string[] } {
  const withDist = cities
    .filter((c) => cityCoords[c])
    .map((c) => ({
      city: c,
      dist: haversineKm(userLat, userLon, cityCoords[c][0], cityCoords[c][1]),
    }))
    .sort((a, b) => a.dist - b.dist);

  const nearest = withDist.slice(0, topN).map((x) => x.city);
  const nearestSet = new Set(nearest);
  const rest = cities.filter((c) => !nearestSet.has(c));
  return { nearest, rest };
}
