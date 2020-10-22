<?php

  $lat = $_GET["lat"];
  $long = $_GET["long"];

  $api_key = "e539d459f1b045d3bb39f2cd1570aa9f";
  $url = "https://api.opencagedata.com/geocode/v1/json?q=" . $lat . "," . $long . "&key=" . $api_key;

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($ch, CURLOPT_URL, $url);
  $result = curl_exec($ch);
  curl_close($ch);
  $decoded = json_decode($result, true);

  // If body of water is clicked dont look for borders
  if (array_key_exists("body_of_water", $decoded["results"]["0"]["components"])) {
    echo json_encode(["not" => "country"]);
    exit();
  }
  
  //echo $result;
  $country_ISO3 = strtolower($decoded["results"]["0"]["components"]["ISO_3166-1_alpha-3"]);

  $filepath = "../country-borders/" . $country_ISO3 . ".geo.json";
  $file_contents = file_get_contents($filepath);
  
  echo $file_contents;
?>