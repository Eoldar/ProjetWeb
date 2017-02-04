<?php
  $curl=curl_init("http://api.geonames.org/extendedFindNearby?lat="+$_GET["lat"]+"&lng="+$_GET["lng"]+"&username=eoldar");
  curl_setopt_array($curl, array(
      CURLOPT_RETURNTRANSFER => 1,
      CURLOPT_URL => "http://api.geonames.org/extendedFindNearby?lat="+$_GET["lat"]+"&lng="+$_GET["lng"]+"&username=eoldar",
      CURLOPT_USERAGENT => 'Codular Sample cURL Request'
  ));
  $respo=curl_exec($curl);
  curl_close($curl);
?>
