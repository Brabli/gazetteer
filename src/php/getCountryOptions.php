<?php

$filepath = "../helper-json-files/iso2-to-country.json";
$file_contents = file_get_contents($filepath);

header("Content-type: application/json");
echo $file_contents;

?>