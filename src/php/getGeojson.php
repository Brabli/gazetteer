<?php
  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  // Find appropriate geoJSON file from country-geojsons directory using ISO3 code.
  $filepath = "../country-geojsons/" . $_GET["iso3"] . ".geo.json";
  $geojson = file_get_contents($filepath);

  // Send response
  header('Content-type: application/json');
  echo $geojson;