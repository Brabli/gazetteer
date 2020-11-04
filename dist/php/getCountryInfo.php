<?php

$iso2 = $_GET["iso2"];
$restcountries_url = "https://restcountries.eu/rest/v2/alpha/" . $iso2 . "?fields=name;capital;flag;population;region;latlng;currencies;languages;altSpellings";

// cURL to get country info from restcountries
$curl_restcountries = curl_init();
curl_setopt($curl_restcountries, CURLOPT_SSL_VERIFYPEER, FALSE);
curl_setopt($curl_restcountries, CURLOPT_RETURNTRANSFER, TRUE);
curl_setopt($curl_restcountries, CURLOPT_URL, $restcountries_url);
$result = curl_exec($curl_restcountries);
curl_close($curl_restcountries);

header('Content-type: application/json');
echo $result;