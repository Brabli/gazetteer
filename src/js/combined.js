// Returns a coloured marker icon.
// TODO: This is slow, refactor to make it faster
// Possible colours: green grey violet yellow orange blue red green gold
function icon(colour) {
  
  return new L.Icon({
    iconUrl: `img/marker-icon-2x-${colour}.png`,
    shadowUrl: 'img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

// Corrects longitude offset from infinite scrolling map
function correctLongitude(lng) {
  if (Math.abs(lng) === 180) lng += 0.000000001;
  while (lng > 180) { lng -= 360 }
  while (lng < -180) { lng += 360 }
  return lng;
}

// Teleports to the "main" map using current zoom & corrected coords.
// Used when user has scrolled past -180 / 180 longitude range.
function teleport(map) {
  const center = map.getCenter();
  if (Math.abs(center["lng"]) >= 180) {
    center["lng"] = correctLongitude(center["lng"]);
    map.setView(center, map.getZoom());
  }
}

// Removes all layers from map except tile layers
function removeLayers(map) {
  map.eachLayer(layer => {
    if (!layer._url) map.removeLayer(layer);
  });
}

// Populate Country Select
async function populateSelect() {
  const $countrySelect = $("#country-select");
  const countryOptions = await fetch("php/getCountryOptions.php");
  const countryOptionsJson = await countryOptions.json();
  for (const [iso2, country] of Object.entries(countryOptionsJson)) {
    $countrySelect.append(`<option value="${iso2}">${country}</option>`);
  }
}

/* BASE MAPS OBJECT */
const basemaps = {
  
  "World": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),

  "Roads": L.tileLayer("https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
  {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }),
  
  "Terrain": L.tileLayer(
    'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', 
    {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 18,
      ext: 'png'
    }),

  "Topological": L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }),

  "James Bond": L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
  })
};

/* OVERLAY MAPS */
const overlays = {
  "Temperature": L.tileLayer(
    "php/getOverlayTiles.php?z={z}&x={x}&y={y}&tiles=temp_new"
  ),
  "Clouds": L.tileLayer(
    "php/getOverlayTiles.php?z={z}&x={x}&y={y}&tiles=clouds_new"
  ),

  "Precipitation": L.tileLayer(
    "php/getOverlayTiles.php?z={z}&x={x}&y={y}&tiles=precipitation_new"
  ),

  "Wind Speed": L.tileLayer(
    "php/getOverlayTiles.php?z={z}&x={x}&y={y}&tiles=wind_new"
  ),

  "Sea Level Pressure": L.tileLayer(
    "php/getOverlayTiles.php?z={z}&x={x}&y={y}&tiles=pressure_new"
  )
};


/* Fetch Country */
async function fetchCountry(e, countryCode = undefined) {
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
  return countryData;
}

/* Fetch a country's geojson */
async function fetchGeojson(iso3) {
  // If no geojson in storage fetch geojson info from server
  const storedGeojson = localStorage.getItem(iso3);
  if (!storedGeojson) {
    const geojson = await fetch(`php/getGeojson.php?iso3=${iso3}`);
    const geojsonParse = await geojson.json();
    const geojsonString = JSON.stringify(geojsonParse);
    // Try to save geojson, if no storage available don't bother
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
  const geojsonFeature = L.geoJson(geojson);
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


/* Add city markers to map */
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

  // Promise all with map() instead of a loop as this makes the weather calls concurrent, thus speeding up the process of fetching the weather greatly.
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


// These two variables override some settings that allow infinite horizontal scrolling possible. I didn't write them.
const hackedSphericalMercator = L.Util.extend(L.Projection.SphericalMercator, {
  MAX_LATITUDE: 89.999
});
const hackedEPSG3857 = L.Util.extend(L.CRS.EPSG3857, {
  projection: hackedSphericalMercator
});

/* INIT MAP SETUP STUFF */
/*~~~~~~~~~~~~~~~~~~~~~~*/
// Create map
const map = L.map('map', {
  crs: hackedEPSG3857,
  maxBounds: [[-85, -Infinity], [85, Infinity]],
  maxZoom: 17,
  minZoom: 1.5,
  maxBoundsViscosity: 1.0,
  attributionControl: false,
  zoomControl: false
}).fitWorld();

// Add initial basemap tiles
basemaps.World.addTo(map);


/* GENERATE MAP CONTROLS */
/*~~~~~~~~~~~~~~~~~~~~~~*/
// Layer Control
const layerControl = L.control.layers(basemaps, overlays, {
  collapsed: true
});

// Scale Control
const scaleControl = L.control.scale({
  position: "topleft",
  maxWidth: 100
});

// Fly to Location Control
const flyToLocationControl = L.easyButton('fa-bullseye', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(loc => {
      teleport(map);
      map.flyTo(new L.LatLng(loc.coords.latitude, loc.coords.longitude), 16);
    });
  }
}, "Fly to Current Location", {position: "topright"});

// Centre Map Control
const centreMapControl = L.easyButton('fa-expand', () => {
  teleport(map);
  map.flyTo(new L.LatLng(45, -5), 2);
}, "Centre Map", {position: "topright"});

// Attribution Toggle Control
const attributionToggleControl = L.easyButton("fa-quote-left", (() => {
  let attributionToggle = true;
  let attControl = L.control.attribution({prefix: ""});
  let timesToggled = 0;
  function toggle() {
    $("#modal-box").toggle();
    attributionToggle ? attControl.addTo(map) : attControl.remove(map);
    attributionToggle = !attributionToggle;
    timesToggled++;
    // You found the Easter Egg code, well done you!
    if (timesToggled === 20) attControl = L.control.attribution({
      prefix: "Pre-order Crescent Moon: The Game today for exclusive DLC, artwork and more!"
    });
  }
  return toggle;
})(), "Toggle Attributions", {position: "topright"});


/* FINAL SETUP */
/*~~~~~~~~~~~~~~~~~~~~~~*/
// Add controls to map
layerControl.addTo(map);
scaleControl.addTo(map);
flyToLocationControl.addTo(map);
centreMapControl.addTo(map);
attributionToggleControl.addTo(map);

// Adds a close button to layer control. It's hacky but it works.
$(".leaflet-control-layers-base").prepend('<a class="leaflet-popup-close-button" id="layer-control-close-button" href="#close">×</a>')
$("#layer-control-close-button").on("click", () => {
  layerControl.collapse();
});

// Populate country select
populateSelect();


//~~~~~~~~~~~~~~~~~~~~~~~~
/* EVENT HANDLERS BELOW */
//~~~~~~~~~~~~~~~~~~~~~~~~
// Global loading variable
let loading = false;

/* MOUSE CLICK HANDLER */
map.on("click", async e => {
  // Turn on loader
  if (loading) return;
  loading = true;
  $(".loader").toggle();
  try {
    // Remove layers and fetch info about where the user clicked
    removeLayers(map);
    const countryData = await fetchCountry(e);
    // Early return if response is not ok, EG if click is over an ocean.
    if (countryData.message !== "ok") {
      console.log(countryData.message);
    } else {
      const geojson = await fetchGeojson(countryData.data.iso3);
      teleport(map);
      addGeojsonToMap(geojson, map);
      await getCountryInfo(countryData.data);
      await addCityMarkers(countryData.data.iso2, countryData.data.flag, map);
    }
  } catch(err) {
    console.log(err);
  }
  // Turn off loader
  $(".loader").toggle();
  loading = false;
});


/* COUNTRY SELECT HANDLER */
$("#country-select").on("change", async () => {
  // Get selected country's iso2
  const iso2 = $("#country-select option:selected").val();

  if (iso2 !== "default" && !loading) {
  loading = true;
  $(".loader").toggle();
  
  try {
    // Remove layers and fetch country info
    removeLayers(map);
    const countryData = await fetchCountry(null, iso2);

    // Early return if response is not ok
    if (countryData.message !== "ok") {
      console.log(countryData.message);
    } else {
      const geojson = await fetchGeojson(countryData.data.iso3);
      teleport(map);
      addGeojsonToMap(geojson, map);
      await getCountryInfo(countryData.data);
      await addCityMarkers(countryData.data.iso2, countryData.data.flag, map);
    }
  } catch(err) {
    console.log(err);
  }

  $(".loader").toggle();
  loading = false;
  }
});

/* COUNTRY INFO SLIDE TOGGLE */
$("#tab").on("click", () => {
  $(".content").slideToggle({
    duration: 250
  });
  $("#arrow").toggleClass("flip");
});

// Clears local storage on window close
window.addEventListener("unload", () => {
  localStorage.clear();
});