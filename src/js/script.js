// Module imports
import { basemaps, overlays } from "./tiles.js";
import { correctLongitude, icon, teleport, removeLayers } from "./helpers.js";
import onclick from "./onclick.js";

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
$(".leaflet-control-layers-base").prepend('<a class="leaflet-popup-close-button" id="layer-control-close-button" href="#close">×</a>')
$("#layer-control-close-button").on("click", () => {
  layerControl.collapse();
});


let loading = false;

/* MAIN CLICK HANDLER */
map.on("click", async e => {

  if (loading) return;
  loading = true;
  $(".loader").toggle();

  await onclick(e, map);

  $(".loader").toggle();
  loading = false;
});

// Decided not to include this as I couldn't get it to look good onscreen.
/* LAT LONG DISPLAY HANDLER */
// const $lat = $("#lat");
// const $long = $("#long");
// map.on("move", () => {
//   const centre = map.getCenter();
//   $lat.text("Lat: " + centre["lat"]);
//   $long.text("Long: " + centre["lng"]);
// })


// move to helpers
/* Populate Country Select */
async function populateSelect() {
  const $countrySelect = $("#country-select");
  const countryOptions = await fetch("php/getCountryOptions.php");
  const countryOptionsJson = await countryOptions.json();
  for (const [iso2, country] of Object.entries(countryOptionsJson)) {
    console.log(`${iso2}, ${country}`);
    $countrySelect.append(`<option value="${iso2}">${country}</option>`);
  }
}

populateSelect();

/* SELECT HANDLER */
$("#country-select").on("change", async () => {
  console.log("Change");
  const val = $("#country-select option:selected").val();
  console.log(val);
  if (val !== "default" && !loading) {

    loading = true;
    $(".loader").toggle();
    await onclick(null, map, val);

    loading = false;
    $(".loader").toggle();
  } else {
    return;
  }
})