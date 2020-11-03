import { correctLongitude, icon } from "./helpers.js";


/* Fetch Country */
async function fetchCountry(e, countryCode = undefined) {
    // Init vars
    let countryRes;
    // If no country code provided find country based on click event's lat/long.
    if (!countryCode) {
      const lat = e.latlng["lat"];
      const lng = correctLongitude(e.latlng["lng"]);
      countryRes = await fetch(`php/getCountry.php?lat=${lat}&long=${lng}`);
    // Otherwise look up country with iso2. Used by Select Country dropdown.
    } else {
      countryRes = await fetch(`php/getCountry.php?code=${countryCode}`);
    }
    // Parse and return response
    const countryData = await countryRes.json();
    console.log(countryData);
    return countryData;
}

/* Fetch a country's geojson */
async function fetchGeojson(iso3) {
  const storedGeojson = localStorage.getItem(iso3);
  if (!storedGeojson) {
    console.log("Not stored");
    // If no geojson in storage fetch geojson info from server
    const geojson = await fetch(`php/getGeojson.php?iso3=${iso3}`);
    const geojsonParse = await geojson.json();
    const geojsonString = JSON.stringify(geojsonParse);
    localStorage.setItem(iso3, geojsonString);
    return geojsonParse;
    // Otherwise return stored geojson
  } else {
    console.log("Stored");
    return JSON.parse(storedGeojson);
  }
}


/* Add geojson to map and fit to screen. */
function addGeojsonToMap(geojson, map) {
  const geojsonFeature = L.geoJson(geojson);
  geojsonFeature.addTo(map);
  map.fitBounds(geojsonFeature.getBounds());
}


/* Fetch actual country info for info box */
async function getCountryInfo(data) {
  const res = await fetch(`php/getCountryInfo.php?iso2=${data.iso2}`);
  const resJson = await res.json();
  $("#info-country").html(`${data["countryName"]}<img id="info-flag" src=${resJson.flag} />`);
  $("#info-cont").html(resJson["region"]);
  $("#info-pop").html(resJson["population"].toLocaleString());
  $("#info-cap").html(resJson["capital"]);

  // Rounds lat / long. parseFloat() removes any trailing zeroes from toFixed().
  const lat = parseFloat(resJson["latlng"][0].toFixed(4)) + "°";
  const lng = parseFloat(resJson["latlng"][1].toFixed(4)) + "°";

  $("#info-coords").html(lat + ", " + lng);
  // If no symbol associated with currency just display currency name
  if (resJson["currencies"][0]["symbol"] === undefined) {
    $("#info-currency").html(resJson["currencies"][0]["name"]);
  } else {
    $("#info-currency").html(resJson["currencies"][0]["name"] + " ( " + resJson["currencies"][0]["symbol"] + " )");
  }
  $("#info-lan").html(resJson["languages"][0]["name"]);
  $("#info-link").html(`<a href="${data.wikiLink}" target="_blank">Open Wikipedia page in new tab</a>`);
}


/* Add city markers to map */
async function addCityMarkers(iso2, flag, map) {
  let cityInfoJson;
  const cityInfoStored = sessionStorage.getItem(`cities_${iso2}`);

  if (!cityInfoStored) {
    // Fetch City Info, checks session storage first to see if cities list exists already.
    const cityInfo = await fetch(`php/getCityInfo.php?iso2=${iso2}`);
    cityInfoJson = await cityInfo.json();
    sessionStorage.setItem(`cities_${iso2}`, JSON.stringify(cityInfoJson));
    console.log(cityInfoJson);
  } else {
    cityInfoJson = JSON.parse(cityInfoStored);
  }

  
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
}

export { fetchCountry, fetchGeojson, addGeojsonToMap, addCityMarkers, getCountryInfo };