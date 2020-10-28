<?php

  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $city = $_GET["city"];
  $api_key = "5ef63273faed449d6aa6767c0b02c334";
  
  $openweather_url = "api.openweathermap.org/data/2.5/weather?q=" . strtolower($city) . "&appid=" . $api_key . "&units=metric";

  // cURL to get weather info
  $curl_weather = curl_init();
  curl_setopt($curl_weather, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_weather, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_weather, CURLOPT_URL, $openweather_url);
  $result = curl_exec($curl_weather);
  curl_close($curl_weather);

  $decoded = json_decode($result, true);
  
  // Error handing
  if (!(array_key_exists("cod", $decoded) && $decoded["cod"] === 200)) {
    $response["status"] = "error";
    echo json_encode($response);
    exit();
  }


  $response["status"] = "ok";
  $response["condition"] = ucwords($decoded["weather"][0]["description"]);
  
  $response["iconUrl"] = "http://openweathermap.org/img/wn/" . $decoded["weather"][0]["icon"] . "@2x.png";
  // Deg Celsius
  $response["temp"] = round($decoded["main"]["temp"], 1);
  // Meters per seconds to miles per hour
  $response["windSpeed"] = round($decoded["wind"]["speed"] * 2.237, 1);
  // Percentage cloud cover
  $response["cloudCover"] = $decoded["clouds"]["all"];
  // Percentage humidity
  $response["humidity"] = $decoded["main"]["humidity"];


  $speed = $response["windSpeed"];
  switch (true) {
    case $speed < 1:
      $response["windStatement"] = "Calm";
      break;
    case $speed < 4:
      $response["windStatement"] = "Light Air";
      break;
    case $speed < 8:
      $response["windStatement"] = "Light Breeze";
      break;
    case $speed < 13:
      $response["windStatement"] = "Gentle Breeze";
      break;
    case $speed < 19:
      $response["windStatement"] = "Moderate Breeze";
      break;
    case $speed < 25:
      $response["windStatement"] = "Fresh Breeze";
      break;
    case $speed < 32:
      $response["windStatement"] = "Strong Breeze";
      break;
    case $speed < 39:
      $response["windStatement"] = "Moderate Gale";
      break;
    case $speed < 47:
      $response["windStatement"] = "Fresh Gale";
      break;
    case $speed < 55:
      $response["windStatement"] = "Strong Gale";
      break;
    case $speed < 64:
      $response["windStatement"] = "Whole Gale";
      break;
    case $speed < 73:
      $response["windStatement"] = "Storm";
      break;
    case $speed >= 73:
      $response["windStatement"] = "Calm";
      break;
    default:
      $response["windStatement"] = "Hurricane";
      break;
  }
  $response["apiUrl"] = $openweather_url;

  header('Content-type: application/json');
  echo json_encode($response);
?>