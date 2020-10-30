import { correctLongitude, icon } from "./helpers.js";

/* Fetch Geojson */
// This also fetches some other country data, EG flag and iso2
async function fetchGeojson(e, countryCode = undefined) {
  // Init vars
  let countryJson, countryRes;
  // If no country code provided find country based on click event's lat/long.
  if (!countryCode) {
    const lat = e.latlng["lat"];
    const lng = correctLongitude(e.latlng["lng"]);
    countryRes = await fetch(`php/getCountryBorders.php?lat=${lat}&long=${lng}`);
  // Otherwise look up country with iso2. Used by Select Country dropdown.
  } else {
    countryRes = await fetch(`php/getCountryBorders.php?code=${countryCode}`);
  }
  // Parse and return response
  countryJson = await countryRes.json();
  return countryJson;
}

/* Add geojson to map and fit to screen. */
function addGeojsonToMap(geojson, map) {
  const geojsonFeature = L.geoJson(geojson);
  geojsonFeature.addTo(map);
  map.fitBounds(geojsonFeature.getBounds());
}


/* Add city markers to map */
async function addCityMarkers(iso2, flag, map) {

  /* Fetch City Info */
  const cityInfo = await fetch(`php/getCityInfo.php?iso2=${iso2}`);
  const cityInfoJson = await cityInfo.json();
  console.log(cityInfoJson);
  // use .map() and promiseAll to speed this up?
  // Make markers (move to it's own func / file)
  console.time("a");
  await Promise.all(
  cityInfoJson.map(async city => {
   
    const weatherInfo = await fetch(`php/getCityWeather.php?city=${city.name}`);
    const weather = await weatherInfo.json();
    
    if (weather.status !== "ok") return false;

    const cityMarker = L.marker([city.lat, city.long], {
      icon: city.isCapital ? icon("red") : icon("blue")
    })

    .bindPopup(`
    <div class="city-popup" id="${city.name}">
      <h2 class="city-name">${city.name}${city.isCapital ? " &#9733;" : ""}</h2>
      <div class="center">
        <h4 class="city-country-name">${city.country}</h4>
        <span class="flag">${flag}</span>
      </div>
      <hr />
      <table class="quick-info-table">
        <tr>
          <th>Population:</th>
          <td>${city.population.toLocaleString()}</td>
        </tr>
        <tr>
          <th>Latitude:</th>
          <td>${city.lat}</td>
        </tr>
        <tr>
          <th>Longitude:</th>
          <td>${city.long}</td>
        </tr>
      </table>
      <hr />
      <h4 class="weather-title">Local Weather</h4>
      <table class="weather-table">
        <tr>
          <th>Condition:</th>
          <td>${weather.condition}</td>
        </tr>
        <tr>
          <th>Cloud Cover:</th>
          <td>${weather.cloudCover}%</td>
        </tr>  
        <tr>
          <th>Temperature:</th>
          <td>${weather.temp}&#8451;</td>
        </tr>
        <tr>
          <th>Humidity:</th>
          <td>${weather.humidity}%</td>
        </tr>
        <tr>
          <th>Wind Speed:</th>
          <td>${weather.windSpeed}mph - ${weather.windStatement}</td>
      </tr>      
      </table>
    </div>
    `);
    cityMarker.addTo(map);
 })
);
 console.timeEnd("a");
}

export { fetchGeojson, addGeojsonToMap, addCityMarkers };