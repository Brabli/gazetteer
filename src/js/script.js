$(document).ready(() => {

  const map = L.map('map', {
    maxZoom: 18,
    minZoom: 2,
    maxBoundsViscosity: 0.0
  })
  .fitWorld();

  map.locate({
    setView: true,
    maxZoom: 15
    });
  basemaps.World.addTo(map);
  L.control.layers(basemaps, overlays).addTo(map);

  map.on("click", async e => {
    const result = await fetch(`php/getCountryBorders.php?lat=${e.latlng["lat"]}&long=${e.latlng["lng"]}`);
    const resultParse = await result.json();
      
    const geojsonFeature = JSON.stringify(resultParse);
    console.log(geojsonFeature);
    L.geoJson(JSON.parse(geojsonFeature)).addTo(map);
  });
});

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