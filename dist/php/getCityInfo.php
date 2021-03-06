<?php

  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $iso2 = $_GET["iso2"];
  $geonames_url = "http://api.geonames.org/searchJSON?username=brabli&country=" . $iso2 . "&maxRows=20";

  // cURL to get city info from geonames
  $curl_geonames = curl_init();
  curl_setopt($curl_geonames, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_geonames, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_geonames, CURLOPT_URL, $geonames_url);
  $result = curl_exec($curl_geonames);
  curl_close($curl_geonames);
  $decoded = json_decode($result, true);
  $decoded = $decoded["geonames"];

  // Remove non-cities from results
  foreach ($decoded as $key => $entry) {
    if ($entry["fclName"] !== "city, village,..." || $entry["countryCode"] !== strtoupper($iso2)) {
      unset($decoded[$key]);
    }
  }

  // Reduce to maximum of 12 entries
  $decoded = array_slice($decoded, 0, 12);

  // Construct json response by looping over $decoded results array
  $response = [];
  foreach ($decoded as $entry) {
    $city["name"] = $entry["name"];
    $city["population"] = $entry["population"];
    $city["lat"] = $entry["lat"];
    $city["long"] = $entry["lng"];
    $city["country"] = $entry["countryName"];
    $city["iso2"] = strtolower($entry["countryCode"]);
    if (strpos($entry["fcodeName"], "capital") !== FALSE) {
      $city["isCapital"] = TRUE;
    } else {
      $city["isCapital"] = FALSE;
    }
    array_push($response, $city);
  }

  // Send response
  header('Content-type: application/json');
  echo json_encode($response);