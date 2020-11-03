// Module imports
import { basemaps, overlays } from "./tiles.js";
import { teleport, removeLayers, populateSelect } from "./helpers.js";
import { fetchGeojson, fetchCountry, addGeojsonToMap, addCityMarkers, getCountryInfo } from "./onclick.js";

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

// Add controls to map
layerControl.addTo(map);
scaleControl.addTo(map);
flyToLocationControl.addTo(map);
centreMapControl.addTo(map);
attributionToggleControl.addTo(map);

// Populate country select
populateSelect();

// Adds a close button to layer control. It's hacky but it works.
$(".leaflet-control-layers-base").prepend('<a class="leaflet-popup-close-button" id="layer-control-close-button" href="#close">×</a>')
$("#layer-control-close-button").on("click", () => {
  layerControl.collapse();
});

// Global loading variable
let loading = false;


//~~~~~~~~~~~~~~~~~~~~~~~~
/* EVENT HANDLERS BELOW */
//~~~~~~~~~~~~~~~~~~~~~~~~

/* MOUSE CLICK HANDLER */
map.on("click", async e => {

  // Turn on loader
  console.log("CLICK");
  if (loading) return;
  loading = true;
  $(".loader").toggle();

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

  // Turn off loader
  $(".loader").toggle();
  loading = false;
});


/* COUNTRY SELECT HANDLER */
$("#country-select").on("change", async () => {
  // Get country selected iso2
  const iso2 = $("#country-select option:selected").val();

  if (iso2 !== "default" && !loading) {
  loading = true;
  $(".loader").toggle();

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

  $(".loader").toggle();
  loading = false;

  }
});

/* COUNTRY INFO SLIDE TOGGLE */
$("#tab").on("click", () => {
  console.log("Toggle");
  $(".content").slideToggle({
    duration: 250
  });
  $("#arrow").toggleClass("flip");
});

// Clears local storage on window close
window.addEventListener("unload", () => {
  localStorage.clear();
})