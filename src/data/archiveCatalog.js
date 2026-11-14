import source from './archiveDashboard.json';
import { moon } from './moon';
import { mars } from './mars';

// The seven reference-panel records below are preserved from the supplied dashboard.html.
// NASA links/identifiers are attached to the corresponding existing surface assets.
const match = {
  spirit: { surfaceId: 'twins', nasa: mars.records[1][4], imageId: 'PIA07829' },
  opportunity: { surfaceId: 'twins', nasa: mars.records[1][4], imageId: 'PIA08812' },
  sojourner: { surfaceId: 'sojourner', nasa: mars.records[0][4], imageId: 'PIA01122' },
  eagle: { surfaceId: 'eagle', nasa: moon.records[0][4], imageId: 'AS11-40-5927' },
  apollo15_lrv: { surfaceId: 'rover', nasa: moon.records[1][4], imageId: 'AS15-88-11901' },
  surveyor3: { surfaceId: 'surveyor', nasa: moon.records[2][4], imageId: 'AS12-48-7134' },
  voyager1: { surfaceId: null, nasa: 'https://science.nasa.gov/mission/voyager/voyager-1/', imageId: 'PIA00452' },
};
const curated = source.map(item => ({ ...item, ...match[item.id], sourceKind: 'Reference dashboard + linked NASA mission record' }));

const extras = [
  {
    id:'alsep', surfaceId:'alsep', name:'APOLLO 12 ALSEP', subtitle:'Apollo Lunar Surface Experiments Package • Ocean of Storms',
    world:'MOON',status:'LEFT ON THE MOON',statusColor:'cyan',date:'NOV 19, 1969', lifespan:'Until 1977',
    planned:'Lunar surface science',distance:'Multiple sensors',opsSub:'Seismic / magnetic',
    location:'Oceanus Procellarum', modelType:'alsep_station', imageId:'AS12-47-6918', nasa:moon.records[3][4],
    photos:[{url:'/assets/surface/alsep-nasa.webp',caption:'Apollo 12 Lunar Surface Experiments Package',credit:'NASA / Apollo 12'}],
    brief:{goal:'Record lunar seismic activity, magnetic field, solar wind, and the Moon’s environment.',discovery:'Returned long-running measurements that helped reveal the lunar interior and environment.',challenge:'Operate autonomously on the airless Moon after the crew departed.',legacy:'Part of the Apollo scientific network left on the lunar surface.'},
    briefMy:{goal:'လ၏ငလျင်၊ သံလိုက်စက်ကွင်းနှင့် နေရောင်ခြည်လေအခြေအနေများကို မှတ်တမ်းတင်ရန်။',discovery:'လ၏အတွင်းပိုင်းနှင့် ပတ်ဝန်းကျင်အကြောင်း အချိန်ကြာမြင့်စွာ တိုင်းတာချက်များ ပို့ဆောင်ခဲ့သည်။',challenge:'အာကာသယာဉ်မှူးများ ပြန်သွားပြီးနောက် အလိုအလျောက် ဆက်လက်လုပ်ဆောင်ရခြင်း။',legacy:'လပေါ်တွင် ကျန်ရစ်ခဲ့သော Apollo သိပ္ပံစခန်းများအနက် တစ်ခုဖြစ်သည်။'},
    chapters:[{code:'01 DEPLOY',title:'Apollo 12 deployment (1969)',text:'The crew installed the experiment suite at their lunar landing site.',photoIdx:0},{code:'02 SCIENCE',title:'Surface telemetry',text:'Experiments sent measurements back to Earth after the crew left.',photoIdx:0},{code:'03 LEGACY',title:'A permanent scientific relic',text:'The hardware remains in the Ocean of Storms.',photoIdx:0}]
  },
  {
    id:'ingenuity',surfaceId:'ingenuity',name:'INGENUITY',subtitle:'Mars Helicopter • Jezero Crater',world:'MARS',status:'MISSION COMPLETE',statusColor:'amber',
    date:'APR 19, 2021',lifespan:'72 Flights',planned:'Tech Demo',distance:'17+ km (total)',opsSub:'First powered off-world flight',
    location:'Jezero Crater',modelType:'mars_helicopter',imageId:'PIA24547',nasa:mars.records[2][4],
    photos:[{url:'/assets/surface/ingenuity-nasa.webp',caption:'Ingenuity Mars Helicopter NASA mission photograph',credit:'NASA / JPL-Caltech'}],
    brief:{goal:'Demonstrate powered, controlled flight in the thin Martian atmosphere.',discovery:'Proved rotorcraft can take flight on another planet.',challenge:'Extremely thin air, temperature swings, and autonomous navigation.',legacy:'Opened a new way to explore other planetary surfaces by air.'},
    briefMy:{goal:'အင်္ဂါဂြိုဟ်၏ ပါးလွှာသောလေထုအတွင်း စက်အားဖြင့် ထိန်းချုပ်ပျံသန်းနိုင်ကြောင်း ပြသရန်။',discovery:'အခြားဂြိုဟ်ပေါ်တွင် ရဟတ်ယာဉ် ပျံနိုင်ကြောင်း သက်သေပြခဲ့သည်။',challenge:'လေထုပါးလွှာမှု၊ အပူချိန်ကွာခြားမှုနှင့် အလိုအလျောက် ထိန်းချုပ်မှု။',legacy:'အနာဂတ်ဂြိုဟ်လေကြောင်းစူးစမ်းမှုအတွက် အခြေခံဖြစ်လာခဲ့သည်။'},
    chapters:[{code:'01 FLIGHT',title:'First powered flight (2021)',text:'Made history with the first controlled flight on Mars.',photoIdx:0},{code:'02 EXTENSION',title:'Beyond the technology demo',text:'Continued flying as a route scout for Perseverance.',photoIdx:0},{code:'03 FINAL',title:'72 flights completed',text:'Rotor damage during the final flight brought the mission to a close.',photoIdx:0}]
  },
  {
    id:'phoenix',surfaceId:'phoenix',name:'PHOENIX',subtitle:'Mars Polar Lander • Northern Plains',world:'MARS',status:'MISSION COMPLETE',statusColor:'amber',
    date:'MAY 25, 2008',lifespan:'157 Sols',planned:'90 Sols',distance:'Stationary lander',opsSub:'Robotic-arm dig',
    location:'Vastitas Borealis',modelType:'mars_lander',imageId:'PIA10664',nasa:mars.records[3][4],
    photos:[{url:'/assets/surface/phoenix-nasa.webp',caption:'Phoenix lander and exploration equipment, Mars mission archive',credit:'NASA / JPL-Caltech / University of Arizona'}],
    brief:{goal:'Study water ice and soil chemistry near the Martian north pole.',discovery:'Confirmed water ice below the surface.',challenge:'Cold, dust, and fading sunlight as Martian winter approached.',legacy:'Established ground truth for buried ice in the northern plains.'},
    briefMy:{goal:'အင်္ဂါဂြိုဟ်မြောက်ဝင်ရိုးနားရှိ ရေခဲနှင့် မြေဓာတုဗေဒကို လေ့လာရန်။',discovery:'မြေအောက်နားတွင် ရေခဲရှိနေကြောင်း အတည်ပြုခဲ့သည်။',challenge:'အေးလွန်းမှု၊ ဖုန်မှုန့်နှင့် ဆောင်းရာသီနေရောင်နည်းပါးမှု။',legacy:'မြောက်ပိုင်းမြေပြင်၏ ရေခဲရှိမှုကို တိုက်ရိုက်အထောက်အထားဖြင့် ပြသခဲ့သည်။'},
    chapters:[{code:'01 LANDING',title:'Polar landing (2008)',text:'Phoenix landed on the northern plains of Mars.',photoIdx:0},{code:'02 ICE',title:'Excavating Martian ice',text:'The robotic arm exposed subsurface water ice.',photoIdx:0},{code:'03 WINTER',title:'Final winter',text:'The lander ceased communications during the Martian winter.',photoIdx:0}]
  }
];
export const archiveCatalog = [...curated, ...extras];
export const forSurface = (world) => archiveCatalog.filter(x => x.world === world.toUpperCase());
export const matchArtifact = (world, id) => {
  const matchingWorld = String(world || '').toUpperCase();
  const requestedId = String(id || '');
  // A direct record ID always identifies exactly that machine.
  const precise = archiveCatalog.find(x => x.world === matchingWorld && x.id === requestedId);
  if (precise) return precise;
  // The in-world MER twins marker represents one inspection target; default to Spirit.
  if (requestedId === 'twins' && matchingWorld === 'MARS') return archiveCatalog.find(x => x.id === 'spirit');
  return archiveCatalog.find(x => x.world === matchingWorld && x.surfaceId === requestedId) || null;
};
