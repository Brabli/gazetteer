// Module imports
import { basemaps, overlays } from "./tiles.js";
import { correctLongitude, icon, teleport } from "./helpers.js";

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
  maxBoundsViscosity: 1.0,
  attributionControl: false,
  zoomControl: false
}).fitWorld();

// Add initial basemap tiles
basemaps.World.addTo(map);

// Layer Control
const layerControl = L.control.layers(basemaps, overlays, {
  collapsed: true
});
  
// Scale Control
const scaleControl = L.control.scale({
  position: "topleft",
  maxWidth: 200
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

// Add controls to map
layerControl.addTo(map);
scaleControl.addTo(map);
flyToLocationControl.addTo(map);
centreMapControl.addTo(map);
attributionToggleControl.addTo(map);


// Adds a close button to layer control. It's hacky but it works.
// Close button stolen from popup close button
$(".leaflet-control-layers-base").prepend('<a class="leaflet-popup-close-button" id="layer-control-close-button" href="#close">×</a>')
$("#layer-control-close-button").on("click", () => {
  layerControl.collapse();
});



let loadingBorders = false;
// Stops mouse bouncing in chrome
let lastClick = 0;
const delay = 5;

/* MAIN CLICK HANDLER */
map.on("click", async e => {

  console.log("Click!");
  console.log("loading borders: " + loadingBorders);

 if (loadingBorders) {
   return;
 }

 if (lastClick >= (Date.now() - delay))
   return;
 lastClick = Date.now();

 loadingBorders = true;

 // Remove border and marker layers
 map.eachLayer(layer => {
   if (!layer._url) map.removeLayer(layer);
 });

 // Fetch Country Info 
 const lat = e.latlng["lat"];
 const lng = correctLongitude(e.latlng["lng"]);
 const countryRes = await fetch(`php/getCountryBorders.php?lat=${lat}&long=${lng}`);
 const countryJson = await countryRes.json();
 
 loadingBorders = false;
 // Return out of func if over ocean
 if (countryJson.message !== "ok") {
   console.log(countryJson.message);
   return;
 }
 
 // Teleports user to main map
 teleport(map);

 // Add border to map and fit it on screen.
 // Acts funky if borders cross antimeridian line.
 const geojsonFeature = L.geoJson(countryJson.geojson);
 geojsonFeature.addTo(map);
 map.fitBounds(geojsonFeature.getBounds());




 /* Fetch City Info */
 const cityInfo = await fetch(`php/getCityInfo.php?iso2=${countryJson.data.iso2}`);
 const cityInfoJson = await cityInfo.json();

 // Make markers (move to it's own func / file)
 for (const city of cityInfoJson) {
   if (loadingBorders) {
     map.eachLayer(layer => {
       if (!layer._url) map.removeLayer(layer);
     });
     break;
   }

   // Own func
   const weatherInfo = await fetch(`php/getCityWeather.php?city=${city.name}`);
   const weather = await weatherInfo.json();

   const cityMarker = L.marker([city.lat, city.long], {
     icon: city.isCapital ? icon("red") : icon("blue")
   })
   .bindPopup(`
   <div class="city-popup" id="${city.name}">
     <h2>${city.name}${city.isCapital ? " &#9733;" : ""
     }</h2>
     <h4 style="font-style: italic">${city.country} <span style="font-size: 20px; vertical-align: middle">${countryJson.data.flag}</span></h4>
     <hr />
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
     </table>
     <hr />
     <h4>Current weather</h4>
     <table>
       <tr>
         <th>Condition:</th>
         <td>${weather.condition} <img src="${weather.iconUrl}" style="height:20px;width:20px;"/></td>
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
         <th>Wind:</th>
         <td>${weather.windSpeed}mph (${weather.windStatement})</td>
     </tr>      
     </table>
   </div>
   `);
   // end func here

   cityMarker.addTo(map);
 }

});

const $lat = $("#lat");
const $long = $("#long");
map.on("move", () => {
  const centre = map.getCenter();
  $lat.text("Lat: " + centre["lat"]);
  $long.text("Long: " + centre["lng"]);
})