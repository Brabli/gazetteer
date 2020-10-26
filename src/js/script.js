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
  maxBoundsViscosity: 0.5,
  attributionControl: false,
  zoomControl: false
  //worldCopyJump: true
})
.fitWorld();

// Add initial basemap tiles
basemaps.World.addTo(map);


// Layer Control
const layerControl = L.control.layers(basemaps, overlays, {
  collapsed: true
})
  .addTo(map);
  
// Scale
L.control.scale({
  position: "topleft",
  maxWidth: 200
}).addTo(map);

// Fly to Location Button
L.easyButton('fa-bullseye', function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(loc => {
      teleport(map);
      map.flyTo(new L.LatLng(loc.coords.latitude, loc.coords.longitude), 16);
    });
  }
}, "Fly to Current Location", {position: "topright"})
  .addTo(map);

// Centre Map Button
L.easyButton('fa-expand', function() {
  teleport(map);
  map.flyTo(new L.LatLng(45, -5), 2);
}, "Centre Map", {position: "topright"})
  .addTo(map);

// Attribution Toggle
let attributionToggle = true;
const attControl = L.control.attribution();
L.easyButton("fa-quote-left", () => {
  attributionToggle ? attControl.addTo(map) : attControl.remove(map);
  attributionToggle = !attributionToggle;
}, "Toggle Attributions", {position: "topright"})
.addTo(map);


 // Adds a close button to layer control
 $(".leaflet-control-layers-base").prepend('<a class="leaflet-popup-close-button" id="layer-control-close-button" href="#close">×</a>')
 $("#layer-control-close-button").on("click", () => {
   layerControl.collapse();
 });



let loadingIcons = false;
let loadingBorders = false;
// Stops mouse bouncing in chrome
let lastClick = 0;
const delay = 5;

/* MAIN CLICK HANDLER */
map.on("click", async e => {
 if (loadingBorders) {
   return;
 }

 //loading = true;
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



 loadingBorders = false;
 /* Fetch City Info */
 loadingIcons = true;
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
   console.log(weather);

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

 loadingIcons = false;
});
