<?php
  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $country_name = $_GET["country"];
  $url = "https://pixabay.com/api/?key=19032298-2540b463772fc5117abff186b&per_page=10&image_type=photo&orientation=horizontal&q=" . $country_name;

  // cURL to get country images
  $curl_images = curl_init();
  curl_setopt($curl_images, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_images, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_images, CURLOPT_URL, $url);
  $result = curl_exec($curl_images);

  $response = json_decode($result, TRUE);
  // Error handling
  $response_code = curl_getinfo($curl_images)["http_code"];
  if ($response_code >= 200 && $response_code <= 299) {
    $response["status"] = "ok";
  } else {
    $response["status"] = "error";
  }

  curl_close($curl_images);
  echo json_encode($response);