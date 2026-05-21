const STREETS = [
  '742 Riverside Drive',
  '1200 Oakwood Boulevard',
  '88 Harbor View Lane',
  '4501 Metro Parkway',
  '210 Cedar Hill Road',
]

const CITIES = [
  'Near Downtown Medical District',
  'Westside Industrial Corridor',
  'Riverside Emergency Zone',
  'Highway 95 Exit 14 Area',
]

export function mockStreetAddress(lat, lng) {
  const seed = Math.abs(Math.floor(lat * 1000 + lng * 1000))
  const street = STREETS[seed % STREETS.length]
  const city = CITIES[seed % CITIES.length]
  return `${street}, ${city}`
}
