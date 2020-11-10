// Module imports
import { basemaps, overlays } from "./tiles.js";
import { teleport, removeLayers, populateSelect } from "./helpers.js";
import { fetchGeojson, fetchCountry, addGeojsonToMap, addCityMarkers, getCountryInfo, getCountryImages } from "./onclick.js";

// Global loading variable
let loading = false;

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
  renderer: L.canvas({
    // 0.5 is a good balance between performance and benefit
    padding: 0.5
  }),
  attributionControl: false,
  zoomControl: false
}).fitWorld();

// Add initial basemap tiles
basemaps.World.addTo(map);


/* CREATE MAP CONTROLS */
/*~~~~~~~~~~~~~~~~~~~~~~*/
// Layer Control
const layerControl = L.control.layers(basemaps, overlays, {
  collapsed: true
});

// Scale Control
const scaleControlKm = L.control.scale({
  position: "bottomright",
  maxWidth: 100,
  metric: false
});

// const scaleControlMiles = L.control.scale({
//   position: "bottomright",
//   maxWidth: 100,
//   imperial: false
// });

// Fly to Location Control
const flyToLocationControl = L.easyButton('fa-bullseye', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(loc => {
      teleport(map);
      map.flyTo(new L.LatLng(loc.coords.latitude, loc.coords.longitude), 16);
    });
  }
}, "Fly to Current Location", {position: "topleft"});

// Centre Map Control
const centreMapControl = L.easyButton('fa-expand', () => {
  teleport(map);
  map.flyTo(new L.LatLng(45, -5), 2);
}, "Centre Map", {position: "topleft"});

// Attribution Control
const attControl = L.control.attribution({
  prefix: "",
  position: "bottomright"
});


/* ADD CONTROLS TO MAP */
/*~~~~~~~~~~~~~~~~~~~~~~*/
attControl.addTo(map);
layerControl.addTo(map);
scaleControlKm.addTo(map);
//scaleControlMiles.addTo(map);
flyToLocationControl.addTo(map);
centreMapControl.addTo(map);

// Adds a close button to layer control. It's hacky but it works.
$(".leaflet-control-layers-base").prepend('<a class="leaflet-popup-close-button" id="layer-control-close-button" href="#close">×</a>')
$("#layer-control-close-button").on("click", () => {
  layerControl.collapse();
});


/* DEFINE FUNCTIONS */
/*~~~~~~~~~~~~~~~~~~~~~~*/
// Select country
async function selectCountry(input) {
  // Check to see if loading already, turn on loader if not.
  if (loading) return;
  loading = true;
  $(".loader").toggle();
  try {
    removeLayers(map);
    // Determine which country user clicked over, returns a small amount of data about the country.
    const countryData = await fetchCountry(input);
    // Check to see if user is indeed over a country
    if (countryData.message === "ok") {
      const {iso3, iso2, flag, countryName} = countryData.data;
      // Fetches the info used in the Country Info box.
      getCountryInfo(countryData.data);
      // Fetches country images
      getCountryImages(countryName);
      // Fetches city and weather data and appends markers to the map.
      addCityMarkers(iso2, flag, map);
      // Geojson last as it's blocking
      const geojson = await fetchGeojson(iso3);
      teleport(map);
      addGeojsonToMap(geojson, map);
    }
  } catch(err) {
    console.log(err);
  }
  // Turn off loader.
  $(".loader").toggle();
  loading = false;
};

// Requests user location on load, sends info to onSuccess which in turn calls selectCountry().
function selectUserCountryOnLoad() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {timeout: 10000});
  }
}

// If geolocation is a success, call selectCountry().
function onSuccess(location) {
  const lat = location.coords.latitude;
  const long = location.coords.longitude;
  selectCountry({latlng: {"lat": lat, "lng": long}});
}

// If geolocation fails, log error.
function onError(err) {
  console.log(err);
}


selectUserCountryOnLoad();
populateSelect();
$(".close-button").hide();

//~~~~~~~~~~~~~~~~~~~~~~~~
/* EVENT HANDLERS BELOW */
//~~~~~~~~~~~~~~~~~~~~~~~~

/* MOUSE CLICK HANDLER */
map.on("click", async e => {
  selectCountry(e);
});

/* COUNTRY SELECT HANDLER */
$("#country-select").on("change", async () => {
  // Get selected country's iso2
  const iso2 = $("#country-select option:selected").val();
  if (iso2 !== "default") {
    selectCountry(iso2);
  }
});

/* COUNTRY INFO SLIDE TOGGLE */
$("#tab").on("click", () => {
  $(".content").slideToggle({
    duration: 250
  });
  $("#arrow").toggleClass("flip");
});

// Open circle images on click.
$(".circle-image").on("click", (e) => {
  const imageLink = $(e.currentTarget).attr("src");
  $(".big-image").html(`<img src=${imageLink} />`);
  $(".big-image-container").show();
  $(".black-screen").show();
  $(".close-button").show();
});

// Close button functionality - closes large images.
$(".close-button").on("click", () => {
  $(".big-image-container").hide();
  $(".black-screen").hide();
})

// Clears local storage on window close.
window.addEventListener("unload", () => {
  localStorage.clear();
});