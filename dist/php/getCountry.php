<?php

  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  // Early return function definition
  function early_return($msg) {
    $response["isCountry"] = FALSE;
    $response["message"] = $msg;
    header('Content-type: application/json');
    echo json_encode($response);
    exit();
  }

  //?lat=-73.52839948765174&long=52.3828125
  
  // example url:
  // https://api.opencagedata.com/geocode/v1/json?q=al&key=e539d459f1b045d3bb39f2cd1570aa9f&countrycode=al&limit=1

  $api_key = "e539d459f1b045d3bb39f2cd1570aa9f";

  // Init vars for cURL call
  if (array_key_exists("code", $_GET)) {
    // Gets country from country code
    $country_code = $_GET["code"];
    $opencage_url = "https://api.opencagedata.com/geocode/v1/json?q=" . $country_code . "&key=" . $api_key . "&countrycode=" . $country_code . "&limit=1";
  } else {
    // Gets country from Lat / Long coords
    $lat = $_GET["lat"];
    $long = $_GET["long"];
    $opencage_url = "https://api.opencagedata.com/geocode/v1/json?q=" . $lat . "," . $long . "&key=" . $api_key . "&limit=1";
  }

  // cURL to get country info from opencage
  $curl_opencage = curl_init();
  curl_setopt($curl_opencage, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_opencage, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_opencage, CURLOPT_URL, $opencage_url);
  $result = curl_exec($curl_opencage);
  curl_close($curl_opencage);
  $decoded = json_decode($result, TRUE);


  // Make sure appropriate data exists in response
  if (array_key_exists("0", $decoded["results"])) {
    $decoded = $decoded["results"]["0"];
  } else {
    early_return("No data found!");
  }

  // Early return if user clicked a body of water instead of a country
  if (array_key_exists("body_of_water", $decoded["components"]) === FALSE) {
    $response["isCountry"] = TRUE;
  } else {
    early_return("Not a country!");
  }
  
  // Get ISO2 code
  $country_ISO2 = $decoded["components"]["ISO_3166-1_alpha-2"];

  // Get ISO3 code (sometimes it's not in respose JSON so we refer to a json file in helper-json-files that maps ISO2 codes to their ISO3 versions). iso codes are UPPERCASE at this point.
  if (array_key_exists("ISO_3166-1_alpha-3", $decoded["components"])) {
    $country_ISO3 = $decoded["components"]["ISO_3166-1_alpha-3"];
  } else {
    $iso_json = json_decode(file_get_contents("../helper-json-files/iso2-to-iso3.json"), TRUE);
    $country_ISO3 = $iso_json[$country_ISO2];
  }
  
  // Construct basic country info JSON response
  $response["message"] = "ok";
  // Do these iso codes need to be lowercase?
  $response["data"]["iso3"] = strtolower($country_ISO3);
  $response["data"]["iso2"] = strtolower($country_ISO2);
  $response["data"]["flag"] = $decoded["annotations"]["flag"];
  $response["data"]["countryName"] = $decoded["components"]["country"];
  $response["data"]["wikiLink"] = str_replace(" ","_", ("https://en.wikipedia.org/wiki/" . $response["data"]["countryName"]));


  // Send response
  header('Content-type: application/json');
  echo json_encode($response);