<?php

  $z = $_GET["z"];
  $x = $_GET["x"];
  $y = $_GET["y"];
  $tileset = $_GET["tiles"];

  $path = "https://tile.openweathermap.org/map/" . $tileset . "/". $z ."/" . $x . "/" . $y . ".png?appid=5ef63273faed449d6aa6767c0b02c334";

  // Send response (tiles in this case)
  header('Content-Type: image/png');
  echo file_get_contents($path);
?>