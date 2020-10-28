import { correctLongitude, icon, teleport, removeLayers } from "./helpers.js";

// MAIN CLICK HANDLER
async function onclick(e, map, countryCode = undefined) {

  // Remove border and marker layers
  removeLayers(map);

  let countryJson;

  if (!countryCode) {
    // Find long and lat of click location
    const lat = e.latlng["lat"];
    const lng = correctLongitude(e.latlng["lng"]);
    // Fetch Country Info 
    const countryRes = await fetch(`php/getCountryBorders.php?lat=${lat}&long=${lng}`);
    countryJson = await countryRes.json();
  } else {
    const countryRes = await fetch(`php/getCountryBorders.php?code=${countryCode}`);
    countryJson = await countryRes.json();
  }
  // Return out of func if response is not ok
  if (countryJson.message !== "ok") {
    console.log(countryJson.message);
    return;
  }

  // Teleports user to main map
  teleport(map);

  // Add border to map and fit it on screen.
  // Acts funky if borders cross antimeridian line.
  const geojsonFeature = L.geoJson(countryJson.geojson);
  removeLayers(map);
  geojsonFeature.addTo(map);
  map.fitBounds(geojsonFeature.getBounds());




  /* Fetch City Info */
  const cityInfo = await fetch(`php/getCityInfo.php?iso2=${countryJson.data.iso2}`);
  const cityInfoJson = await cityInfo.json();

  // Make markers (move to it's own func / file)
  for (const city of cityInfoJson) {
   
    // Own func
    const weatherInfo = await fetch(`php/getCityWeather.php?city=${city.name}`);
    const weather = await weatherInfo.json();
    
    if (weather.status !== "ok") continue;

    const cityMarker = L.marker([city.lat, city.long], {
      icon: city.isCapital ? icon("red") : icon("blue")
    })
    .bindPopup(`
    <div class="city-popup" id="${city.name}">
      <h2 class="city-name">${city.name}${city.isCapital ? " &#9733;" : ""}</h2>
      <div class="center">
        <h4 class="city-country-name">${city.country}</h4>
        <span class="flag">${countryJson.data.flag}</span>
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
    // end func here

    cityMarker.addTo(map);
 }
}

export default onclick;