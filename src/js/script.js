// Module imports
import { basemaps, overlays } from "./tiles.js";
import { correctLongitude, icon } from "./helpers.js";

// These override some settings that allow infinite horizontal scrolling possible. I didn't write them.
const hackedSphericalMercator = L.Util.extend(L.Projection.SphericalMercator, {
  MAX_LATITUDE: 89.999
});
const hackedEPSG3857 = L.Util.extend(L.CRS.EPSG3857, {
  projection: hackedSphericalMercator
});

// Create map
const map = L.map('map', {
  crs: hackedEPSG3857,
  maxBounds: [[-85, -Infinity], [85, Infinity]],
  maxZoom: 17,
  minZoom: 1.5,
  maxBoundsViscosity: 0.5,
  attributionControl: false,
  //worldCopyJump: true
})
.fitWorld();

// Define fly to user location func
function flyToUserLocation() {
  console.log("Flying to location...");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(loc => {
      map.flyTo(new L.LatLng(loc.coords.latitude, loc.coords.longitude), 16);
    });
  }
}

// Add initial basemap tiles
basemaps.World.addTo(map);

// Add controls
// Layer 
L.control.layers(basemaps, overlays).addTo(map);
// Zoom Out
L.easyButton('fa-star', function() {
  map.flyTo(new L.LatLng(45, -5), 2);
}, "Centre Map").addTo(map);
// Fly to Location
L.easyButton('?', flyToUserLocation, "Fly to Current Location").addTo(map);
// Attribution Toggle
let attributionToggle = true;
const attControl = L.control.attribution();
L.easyButton("class", () => {
  attributionToggle ? attControl.addTo(map) : attControl.remove(map);
  attributionToggle = !attributionToggle;
}, "Toggle Attributions").addTo(map);


/* Fetch country info */
map.on("click", async e => {
  // Lat / Lng vars
  const lat = e.latlng["lat"];
  const lng = correctLongitude(e.latlng["lng"]);


  // Request country info
  const countryRes = await fetch(`php/getCountryBorders.php?lat=${lat}&long=${lng}`);
  const countryJson = await countryRes.json();
  
  // Remove all layers except for basetiles and overlay tiles.
  map.eachLayer(layer => {
    if (!layer._url) map.removeLayer(layer);
  });

  // 
  const zoomLevel = map.getZoom();
  const center = map.getCenter();
  center["lng"] = correctLongitude(center["lng"])

  // Return out of func if over ocean
  if (countryJson.message !== "ok") {
    console.log(countryJson.message);
    return;
  }
  map.setView(center, zoomLevel);

  // Add border to map and fit to size
  const geojsonFeature = L.geoJson(countryJson.geojson).addTo(map);
  // Make this fly?
  map.fitBounds(geojsonFeature.getBounds());








  // Request city info
  const cityInfo = await fetch(`php/getCityInfo.php?iso2=${countryJson.data.iso2}`);

  const cityInfoJson = await cityInfo.json();
  console.log(cityInfoJson);

  // Make markers (move to it's own func / file)
  const cityMarkers = [];
  for (const city of cityInfoJson) {
    const cityMarker = L.marker([city.lat, city.long], {
      icon: city.isCapital ? icon("red") : icon("blue")
    }).bindPopup(`
    <div class="city-popup">
      <h2>${city.name}${city.isCapital ? " &#9733;" : ""
      }</h2>
      <h4 style="font-style: italic">${city.country} <span style="font-size: 20px; vertical-align: middle">${countryJson.data.flag}</span></h4>
      <hr>
      <table>
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
      </table
      <hr>
      <table>
    </div>
    `);
    cityMarkers.push(cityMarker);
  }
  // Add marker array to map
  const cityGroup = L.layerGroup(cityMarkers);
  cityGroup.addTo(map);
});
  // Fly to user location
  //flyToUserLocation();