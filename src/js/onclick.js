import { correctLongitude, icon } from "./helpers.js";

/* Fetch Country */
// input parameter will either be a click event object OR an iso2 code.
async function fetchCountry(input) {
  let countryRes;
  // If no country code provided find country based on click event's lat/long.
  // If input.latlng is defined it must be a click event object, otherwise it will be assumed to be a country code EG: "GB".
  if (input.latlng && input !== undefined) {
    const lat = input.latlng["lat"];
    const lng = correctLongitude(input.latlng["lng"]);
    countryRes = await fetch(`php/getCountry.php?lat=${lat}&long=${lng}`);
  // Fetch country based off of iso2 country code.
  } else {
    countryRes = await fetch(`php/getCountry.php?code=${input}`);
  }
  // Parse and return response
  const countryData = await countryRes.json();
  return countryData;
}

/* Fetch a country's geojson */
async function fetchGeojson(iso3) {
  // If no geojson object in storage request geojson object from server.
  const storedGeojson = localStorage.getItem(iso3);
  if (!storedGeojson) {
    const geojson = await fetch(`php/getGeojson.php?iso3=${iso3}`);
    const geojsonParse = await geojson.json();
    const geojsonString = JSON.stringify(geojsonParse);
    // Try to save geojson, if no storage available don't bother.
    try {
      localStorage.setItem(iso3, geojsonString);
    } catch(err) {
      console.log(err);
    }
    return geojsonParse;
    // Otherwise return stored geojson
  } else {
    return JSON.parse(storedGeojson);
  }
}

/* Add geojson to map and fit to screen. */
function addGeojsonToMap(geojson, map) {
  const geojsonFeature = L.geoJson(geojson, {
    style: {
      "color": "rgb(9, 23, 50)",
      "opacity": "0.7",
      "weight": "2",
      "fillColor": "rgba(3,70,118,1)"
    }
  });
  geojsonFeature.addTo(map);
  map.fitBounds(geojsonFeature.getBounds());
}

/* Fetch actual country info for info box and assign values to elements */
async function getCountryInfo(data) {
  try {
    // Fetch and unpack data
    const res = await fetch(`php/getCountryInfo.php?iso2=${data.iso2}`);
    const {region, population, flag, capital, latlng, currencies, languages} = await res.json();
    const {name: currencyName, symbol: currencySymbol} = currencies[0];
    // Rounds lat / long so it's not unnecessarily long. parseFloat() removes any trailing zeroes left by toFixed().
    const lat = parseFloat(latlng[0].toFixed(4)) + "°";
    const lng = parseFloat(latlng[1].toFixed(4)) + "°";
    // Use country name from previously fetched data as it's formatted slightly better in some cases, EG "United Kindom" instead of "The United Kindgom Of Great Britain and Northern Ireland".
    $("#info-country").html(`${data["countryName"]}<img id="info-flag" src=${flag} />`);
    $("#info-cont").html(region);
    // toLocaleString adds commas to population number.
    $("#info-pop").html(population.toLocaleString());
    $("#info-cap").html(capital);
    $("#info-coords").html(`${lat}, ${lng}`);
    $("#currency-name").html(currencyName);
    // Sometimes currency symbol is undefined so this makes sure the text is formatted properly.
    $("#currency-symbol").html(currencySymbol ? `( ${currencySymbol} )` : "");
    $("#info-lan").html(languages[0]["name"]);
    // Use wikilink from previously fetched data from fetchCountry().
    $("#info-link").html(`<a href="${data.wikiLink}" target="_blank">Open Wikipedia page in new tab</a>`);
  } catch(err) {
    console.log(err);
    $("#info-country").html("Something went wrong, sorry!")
    $(".country-info-table td").html("");
  }
}


/* Fetches city info and adds city markers to map. */
async function addCityMarkers(iso2, flag, map) {
  let cityInfoJson;
  const cityInfoStored = sessionStorage.getItem(`cities_${iso2}`);

  // If no stored info request it from PHP routine
  if (!cityInfoStored) {
    const cityInfo = await fetch(`php/getCityInfo.php?iso2=${iso2}`);
    cityInfoJson = await cityInfo.json();
    // Storage error handling
    try {
      sessionStorage.setItem(`cities_${iso2}`, JSON.stringify(cityInfoJson));
    } catch(err) {
      console.log(err);
    }
  } else {
    cityInfoJson = JSON.parse(cityInfoStored);
  }

  // Promise all with map() instead of a loop as this makes the weather calls concurrent, thus greatly speeding up the process of fetching the weather.
  await Promise.all(
    cityInfoJson.map(async city => {

      let weather;
      // Key to weather data looks like "ireland_dublin_weather"
      weather = sessionStorage.getItem(`${city.country}_${city.name}_weather`);
      if (!weather) {
        try {
          const weatherInfo = await fetch(`php/getCityWeather.php?city=${city.name}`);
          weather = await weatherInfo.json();
          sessionStorage.setItem(`${city.country}_${city.name}_weather`, JSON.stringify(weather));
        } catch(err) {
          console.log(err);
        }
      } else {
        weather = JSON.parse(weather);
      }

      // Early return if weather is not available
      if (weather.status !== "ok") return false;

      // Create markers with appropriate data and html.
      const cityMarker = L.marker([city.lat, city.long], {
        icon: city.isCapital ? icon("red") : icon("blue")
      }).bindPopup(`
      
      <div class="city-popup" id="${city.name}">
        <h2 class="city-name big-text-shadow">${city.name}${city.isCapital ? " <span class=\"star\">&#9733;</span>" : ""}</h2>
        <div class="center">
          <h4 class="city-country-name text-shadow">${city.country}</h4>
          <span class="flag">${flag}</span>
        </div>
    
        <table class="quick-info-table">
          <tr>
            <th>Population:</th>
            <td>${city.population.toLocaleString()}</td>
          </tr>
          <tr>
            <th>Latitude:</th>
            <td>${city.lat}°</td>
          </tr>
          <tr id="quick-longitude">
            <th>Longitude:</th>
            <td>${city.long}°</td>
          </tr>
        </table>
      
        <h4 class="weather-title text-shadow">Local Weather</h4>
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
          <tr id="windspeed">
            <th>Wind Speed:</th>
            <td>${weather.windSpeed}mph<br>${weather.windStatement}</td>
        </tr>      
        </table>
      </div>
      `, {autoPan: true}
      );

      // Add marker to map
      cityMarker.addTo(map);

      // Add listen that enables hovering functionality
      cityMarker.on('mouseover', function(e) {
        cityMarker.openPopup();
      });
    })
  );
}

export { fetchCountry, fetchGeojson, addGeojsonToMap, addCityMarkers, getCountryInfo };