/**
 * Named historical resting sites, not map-accurate terrain reconstructions.
 * Individual landscapes are artistic, geology-inspired 2.5D interpretations.
 * NASA references are linked so a visitor can distinguish source facts from art.
 */
export const missionSites = Object.freeze({
  eagle: {
    world: 'moon', short: 'TRanquility', label: 'Tranquility Base', region: 'Mare Tranquillitatis',
    coords: '0.67°N · 23.47°E', style: 'mare',
    detail: 'Dark basaltic mare plain, shallow small craters and Apollo 11 descent-engine scour.',
    source: 'https://www.nasa.gov/history/apollo-11-mission-overview/',
  },
  rover: {
    world: 'moon', short: 'HADLEY', label: 'Hadley–Apennine', region: 'Hadley Rille · Apollo 15',
    coords: '26.13°N · 3.63°E', style: 'rille',
    detail: 'Apennine mountains, sloping foothills, dark Hadley Rille and rover tire marks. Rover parked near Falcon.',
    source: 'https://www.nasa.gov/history/50-years-ago-apollo-15-on-the-moon-at-hadley-apennine/',
  },
  surveyor: {
    world: 'moon', short: 'SURVEYOR', label: 'Surveyor Crater', region: 'Oceanus Procellarum',
    coords: '3.0°S · 23.4°W', style: 'crater',
    detail: 'Surveyor 3 rests inside the shallow impact crater visited by Apollo 12.',
    source: 'https://science.nasa.gov/solar-system/moon/footpads-and-footprints-humans-and-machine-meet-on-the-moon/',
  },
  alsep: {
    world: 'moon', short: 'APOLLO 12', label: 'Apollo 12 ALSEP Site', region: 'Oceanus Procellarum',
    coords: '3.01°S · 23.42°W', style: 'experiment',
    detail: 'Broad basaltic mare, a network of scientific instruments and connecting cable traces.',
    source: 'https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo12info.html',
  },
  sojourner: {
    world: 'mars', short: 'ARES VALLIS', label: 'Carl Sagan Memorial Station', region: 'Ares Vallis',
    coords: '19.3°N · 33.6°W', style: 'floodplain',
    detail: 'Rounded flood-transported rocks, outflow gravels and the Mars Pathfinder station.',
    source: 'https://science.nasa.gov/mission/mars-pathfinder/',
  },
  spirit: {
    world: 'mars', short: 'HOME PLATE', label: 'Home Plate / Troy', region: 'Gusev Crater · Columbia Hills',
    coords: 'Gusev Crater', style: 'volcanic',
    detail: 'Volcanic plateaus, silica-rich sediment and soft sand near Spirit’s final station.',
    source: 'https://mars.nasa.gov/internal_resources/136/',
  },
  opportunity: {
    world: 'mars', short: 'PERSEVERANCE', label: 'Perseverance Valley', region: 'Endeavour Crater rim · Meridiani Planum',
    coords: 'Endeavour Crater', style: 'valley',
    detail: 'Stratified crater-rim outcrops, a shallow descending valley and final rover tracks.',
    source: 'https://science.nasa.gov/mission/mer-opportunity/',
  },
  ingenuity: {
    world: 'mars', short: 'VALINOR HILLS', label: 'Valinor Hills', region: 'Neretva Vallis · Jezero Crater',
    coords: 'Jezero region', style: 'dunes',
    detail: 'Rippling tan sand, low dunes and the final airfield where the 72nd flight ended.',
    source: 'https://science.nasa.gov/blog/farewell-to-our-flying-friend-and-closing-in-on-the-crater-rim/',
  },
  phoenix: {
    world: 'mars', short: 'GREEN VALLEY', label: 'Green Valley', region: 'Vastitas Borealis · northern polar plains',
    coords: '68.22°N · 234.25°E', style: 'polar',
    detail: 'Polygon-cracked polar regolith, subdued ice patches and the stationary lander’s trench.',
    source: 'https://science.nasa.gov/mission/mars-phoenix/',
  },
});
export const siteFor = id => missionSites[id] || missionSites.eagle;
