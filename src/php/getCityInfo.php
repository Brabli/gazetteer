<?php

  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $iso2 = $_GET["iso2"];
  $geonames_url = "http://api.geonames.org/searchJSON?username=brabli&country=" . $iso2 . "&maxRows=10";

  // cURL to get city info from geonames
  $curl_geonames = curl_init();
  curl_setopt($curl_geonames, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_geonames, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_geonames, CURLOPT_URL, $geonames_url);
  $result = curl_exec($curl_geonames);
  curl_close($curl_geonames);
  $decoded = json_decode($result, true);
  $decoded = $decoded["geonames"];

  echo json_encode($decoded);
?>