<?php
  // Debugging
  ini_set('display_errors', 'On');
  error_reporting(E_ALL);

  $country_name = $_GET["country"];
  $url = "https://pixabay.com/api/?key=19032298-2540b463772fc5117abff186b&per_page=8&image_type=photo&orientation=horizontal&q=" . $country_name;

  // cURL to get country images
  $curl_images = curl_init();
  curl_setopt($curl_images, CURLOPT_SSL_VERIFYPEER, FALSE);
  curl_setopt($curl_images, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($curl_images, CURLOPT_URL, $url);
  $result = curl_exec($curl_images);
  curl_close($curl_images);

  echo $result;