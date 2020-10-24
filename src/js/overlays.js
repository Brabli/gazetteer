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

export default overlays;