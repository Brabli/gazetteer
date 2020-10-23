<?php

  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  // Init vars for cURL call
  $lat = $_GET["lat"];
  $long = $_GET["long"];
  $api_key = "e539d459f1b045d3bb39f2cd1570aa9f";
  $opencage_url = "https://api.opencagedata.com/geocode/v1/json?q=" . $lat . "," . $long . "&key=" . $api_key;

  // cURL to get country info from opencage
  $curl_opencage = curl_init();
  curl_setopt($curl_opencage, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_opencage, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_opencage, CURLOPT_URL, $opencage_url);
  $result = curl_exec($curl_opencage);
  curl_close($curl_opencage);
  $decoded = json_decode($result, true);
  $decoded = $decoded["results"][0];

  // Check to see if coords correspond to a country or not
  if (array_key_exists("body_of_water", $decoded["components"])) {
    $response["isCountry"] = FALSE;
    echo json_encode($response);
    exit();
  }

  // Find ISO3 code (eg: gbr, usa, aus)
  $country_ISO3 = strtolower($decoded["components"]["ISO_3166-1_alpha-3"]);

  // Find appropriate geoJSON file from country-borders directory
  $filepath = "../country-borders/" . $country_ISO3 . ".geo.json";
  $file_contents = file_get_contents($filepath);
  
  // Construct JSON response
  $response["isCountry"] = TRUE;
  $response["geojson"] = json_decode($file_contents, TRUE);
  $response["data"]["iso3"] = $country_ISO3;
  $response["data"]["iso2"] = strtolower($decoded["components"]["ISO_3166-1_alpha-2"]);
  $response["data"]["flag"] = $decoded["annotations"]["flag"];
  $response["data"]["countryName"] = $decoded["components"]["country"];
  $response["data"]["continent"] = $decoded["components"]["continent"];
  $response["data"]["wikiLink"] = str_replace(" ","_", ("https://en.wikipedia.org/wiki/" . $response["data"]["countryName"]));
  // For some reason Isle of Man doesn't have currency?
  if (array_key_exists("currency", $decoded["annotations"])) {
    $response["data"]["currencyName"] = $decoded["annotations"]["currency"]["name"];
    $response["data"]["currencySymbol"] = $decoded["annotations"]["currency"]["html_entity"];
  } else {
    $response["data"]["currencyName"] = "British Pound";
    $response["data"]["currencySymbol"] = "&#x00A3;";
  }

  // Send response
  echo json_encode($response);
?>