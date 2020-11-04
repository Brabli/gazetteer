/* BASE MAPS OBJECT */
const basemaps = {
  "World": L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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

export { basemaps, overlays };