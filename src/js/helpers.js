// Returns a coloured marker icon.
// Possible colours: green grey violet yellow orange blue red green gold
function icon(colour) {
  return new L.Icon({
    iconUrl: `img/marker-icon-2x-${colour}.png`,
    shadowUrl: 'img/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

// Corrects longitude offset from infinite scrolling map
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


export { correctLongitude, icon, teleport };