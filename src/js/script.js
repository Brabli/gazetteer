$(document).ready(() => {


  var hackedSphericalMercator = L.Util.extend(L.Projection.SphericalMercator, {
    MAX_LATITUDE: 89.999
  });
  
  var hackedEPSG3857 = L.Util.extend(L.CRS.EPSG3857, {
    projection: hackedSphericalMercator
  });
  

  // var southWest = L.latLng(-89.98155760646617, -180),
  // northEast = L.latLng(89.99346179538875, 180);
  // var bounds = L.latLngBounds(southWest, northEast);

  // Create map
  const map = L.map('map', {
    crs: hackedEPSG3857,
    maxBounds: [[-85, -Infinity], [85, Infinity]],
    maxZoom: 18,
    minZoom: 1.5,
    maxBoundsViscosity: 0.5,
    attributionControl: false
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
  
  // Add initial basemap
  basemaps.World.addTo(map);
  // Add layer control  
  L.control.layers(basemaps, overlays).addTo(map);
  // Add attribution toggle
  // L.control.attribution({
  //   prefix: "test",

  
  // }).addTo(map);
  // Add map zoom out control
  L.easyButton('fa-star', function() {
    map.flyTo(new L.LatLng(35, -15), 2);
  }, "Centre Map").addTo(map);
  // Add fly to user location button
  L.easyButton('?', flyToUserLocation, "Fly to Current Location").addTo(map);

  let attributionToggle = true;
  const attControl = L.control.attribution({
    prefix: ""
  });
  L.easyButton("class",
  () => {
    attributionToggle ? attControl.addTo(map) : attControl.remove(map);
    attributionToggle = !attributionToggle;
  },
  "Toggle Attributions").addTo(map);

  /* Set borders on click handler */
  map.on("click", async e => {

    while (e.latlng['lng'] < -180) {
      e.latlng["lng"] += 360;
    }

    while (e.latlng["lng"] > 180) {
      e.latlng["lng"] -= 360;
    }
    
    // Request country info
    const countryRes = await fetch(`php/getCountryBorders.php?lat=${e.latlng["lat"]}&long=${e.latlng["lng"]}`);
    const countryJson = await countryRes.json();
   
    // Remove all layers except for basetiles and overlay tiles.
    map.eachLayer(layer => {
      if (!layer._url) map.removeLayer(layer);
    });


    let center = map.getCenter();
    while (center['lng'] < -180) {
      center["lng"] += 360;
    }

    while (center["lng"] > 180) {
      center["lng"] -= 360;
    }
    map.setView(center, map.getZoom());

    // Return out of func if over ocean
    if (countryJson.isCountry === false) return;




    // Add border to map and fit to size
    const geojson = countryJson.geojson;
    const geojsonFeature = L.geoJson(geojson).addTo(map);
    // Make this fly?
    map.fitBounds(geojsonFeature.getBounds());

    // Request city info
    const cityInfo = await fetch(`php/getCityInfo.php?iso2=${countryJson.data.iso2}`);

    const cityInfoJson = await cityInfo.json();
    console.log(cityInfoJson);

    



    // Make markers (move to it's own func / file)
    const cityMarkers = [];
    for (city of cityInfoJson) {
      const cityMarker = L.marker([city.lat, city.long], {
        icon: city.isCapital ? redIcon : blueIcon
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
    const cityGroup = L.layerGroup(cityMarkers);
    cityGroup.addTo(map);
    
  });






    // Fly to user location
    flyToUserLocation();
});

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

/* BASE MAPS OBJECT */
const basemaps = {
  "World": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
  "Countries": L.tileLayer(
    'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', 
    {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 18,
      ext: 'png'
    }),
  "Roads": L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
    {
      maxZoom: 20,
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }),
  "Topological": L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    })
};

/* OVERLAY MAPS */
const overlays = {
  "Temperature": L.tileLayer(
    "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=5ef63273faed449d6aa6767c0b02c334"
  ),

  "Clouds": L.tileLayer(
    "https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=5ef63273faed449d6aa6767c0b02c334"
  ),

  "Precipitation": L.tileLayer(
    "https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=5ef63273faed449d6aa6767c0b02c334"
  ),

  "Wind Speed": L.tileLayer(
    "https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=5ef63273faed449d6aa6767c0b02c334"
  ),

  "Sea Level Pressure": L.tileLayer(
    "https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=5ef63273faed449d6aa6767c0b02c334"
  )
};

/* MARKERS */
const blueIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-blue.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-gold.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const redIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-red.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-green.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const orangeIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-orange.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-yellow.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const violetIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-violet.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const greyIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-grey.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});

const blackIcon = new L.Icon({
	iconUrl: 'img/marker-icon-2x-black.png',
	shadowUrl: 'img/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41]
});
