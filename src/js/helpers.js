// Returns a custom marker.
function icon(isCapitalCity) {
  let icon, shape, trueColour;
  if (isCapitalCity) {
    // Capital city styles
    icon = "fa-city";
    shape = "star";
    trueColour = "#8a0303";
  } else {
    // Non capital city styles
    icon = "fa-building";
    shape = "circle";
    trueColour = "rgb(0,55,92)";
  }
  return L.ExtraMarkers.icon({
    icon: icon,
    iconColor: "#f0f8ff",
    svg: true,
    markerColor: trueColour,
    shape: shape,
    prefix: 'fa',
  });
}

// Corrects any longitude offset resulting from infinite scrolling of map
function correctLongitude(lng) {
  if (Math.abs(lng) === 180) lng += 0.000000001;
  while (lng > 180) { lng -= 360 }
  while (lng < -180) { lng += 360 }
  return lng;
}

// Teleports to the "main" map using current zoom & corrected coords.
// Used when user has scrolled past -180 / 180 longitude range.
function teleport(map) {
  const center = map.getCenter();
  if (Math.abs(center["lng"]) >= 180) {
    center["lng"] = correctLongitude(center["lng"]);
    map.setView(center, map.getZoom());
  }
}

// Removes all layers from map except tile layers
function removeLayers(map) {
  map.eachLayer(layer => {
    if (!layer._url) map.removeLayer(layer);
  });
}

// Populate Country Select
async function populateSelect() {
  const $countrySelect = $("#country-select");
  const countryOptions = await fetch("php/getCountryOptions.php");
  const countryOptionsJson = await countryOptions.json();
  for (const [country, iso2] of Object.entries(countryOptionsJson)) {
    $countrySelect.append(`<option value="${iso2}">${country}</option>`);
  }
}

export { correctLongitude, icon, teleport, removeLayers, populateSelect };