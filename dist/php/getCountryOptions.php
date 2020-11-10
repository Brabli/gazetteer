<?php

  $iso2_to_country_name = json_decode(file_get_contents("../helper-json-files/iso2-to-country.json"), TRUE);
  $array_of_geojson_filenames = scandir("../country-geojsons");
  $results = [];

  // Loop through goejson files extracting iso2.
  foreach ($array_of_geojson_filenames as $filename) {
    // Skips any non geojson files, eg "." and ".."
    if (strpos($filename, ".geo.json") !== FALSE) {
      $geojson_contents = file_get_contents("../country-geojsons/" . $filename);
      $decoded_contents = json_decode($geojson_contents, TRUE);
      $iso2 = strtoupper($decoded_contents["features"]["0"]["properties"]["cca2"]);
      // Only if iso2 key exists in iso2-to-country-name object add it to results array.
      if (array_key_exists($iso2, $iso2_to_country_name)) {
        $country_name = $iso2_to_country_name[$iso2];
        $results[$country_name] = $iso2;
      }
    }
  }
  // Sort keys alphabetically before sending json response.
  ksort($results);
  header("Content-type: application/json");
  echo json_encode($results);

?>