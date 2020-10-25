// Returns a coloured marker icon
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
};


// Corrects longitude offset from infinite scrolling map
function correctLongitude(lng) {
  if (lng === 180 || lng === -180) lng += 0.000000001;
  while (lng > 180) { lng -= 360 }
  while (lng < -180) { lng += 360 }
  return lng;
}


export { correctLongitude, icon };