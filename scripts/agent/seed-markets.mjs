// Initial seed from the approved 20 November 2026 discovery register.
// Run only when deliberately rebuilding the initial inventory, not during a refresh.
import { mkdir, writeFile } from 'node:fs/promises';
const sources = {
  lfm:'https://www.lfm.org.uk/markets-home/', ccfm:'https://www.weareccfm.com/our-markets/', good:'https://www.thegoodmarketcompany.com/locations',
  duck:'https://duckpondmarket.com/events', hackney:'https://hackneyfleamarket.com/', go:'https://www.goeast.uk/',
  solo:'https://www.solocraftfair.com/upcomingevents', fox:'https://www.craftyfoxmarket.co.uk/markets',
  urban:'https://urbanmakers.co.uk/christmas-market-mile-end-ecology-pavilion', local:'https://localmakers.uk/apply-market',
  chiswick:'https://chiswickcarbootsale.com/', capital:'https://www.capitalcarboot.com/', booty:'https://www.bootyfullcarboot.com/',
  peckham:'https://www.peckhamcarboot.com/', balham:'https://www.balhamcarboot.com/balhamcarboot',
  tottenham:'https://www.countrysidepromotions.co.uk/car-boots/tottenham-car-boot',
  growing:'https://growingcommunities.org/market', crystal:'https://www.crystalpalacefoodmarket.co.uk/',
  brockley:'https://www.brockleymarket.com/', surbiton:'https://www.surbitonfarmersmarket.co.uk/', kew:'https://kewvillagemarket.org/',
  horniman:'https://www.horniman.ac.uk/event/horniman-market/', cheese:'https://www.chiswickcheesemarket.uk/visit-us/',
  flower:'https://chiswickflowermarket.com/calendar/', food:'https://thefoodmarketchiswick.com/',
  hall:'https://www.myfarmersmarket.co.uk/bexley/', chislehurst:'https://www.myfarmersmarket.co.uk/',
  ace:'https://www.aceeventsltd.co.uk/our-markets', canopy:'https://canopymarket.co.uk/',
  jubilee:'https://jubileemarket.co.uk/', greenwich:'https://greenwichmarket.london/',
  spital:'https://www.oldspitalfieldsmarket.com/events/antiques-market',
  feast:'https://westnorwoodfeast.com/', feastx:'https://westnorwoodfeast.com/feast-christmas-market-2026/',
  lazy:'https://www.eventbrite.co.uk/e/the-lazy-flea-christmas-market-chiswick-house-gardens-december-tickets-2003510288205',
  slc:'https://www.solastcenturyfair.co.uk/next-events/', frock:'https://www.frockmevintagefashion.com/2026-dates'
};
const descriptions = {
  farmers:['Seasonal food and produce from independent traders.','Prodotti di stagione e specialità di produttori indipendenti.'],
  craft:['Handmade goods, independent makers and artisan food.','Creazioni artigianali, piccoli produttori e specialità gastronomiche.'],
  flea:['Vintage objects, collectables and second-hand finds.','Oggetti vintage, collezionismo e occasioni di seconda mano.'],
  carboot:['Browse second-hand clothing, homewares and unexpected finds.','Abbigliamento usato, oggetti per la casa e occasioni da scoprire.'],
  flowers:['Plants and flowers from specialist traders.','Piante e fiori da venditori specializzati.'],
  food:['Independent food traders and artisan specialities.','Specialità gastronomiche e piccoli produttori indipendenti.']
};
const markets=[];
function add(id,name,category,area,venue,source,schedule,extra={}) {
  markets.push({id,name,category,area,venue,source:sources[source],checked:'2026-11-20',description:{en:descriptions[category][0],it:descriptions[category][1]},...schedule,...extra});
}
function recurring(days,start,end,extra={}) { return {recurrence:{days,start,end,from:'2026-11-20',until:'2027-02-28',...extra}}; }
function dated(dates,start,end) { return {dates:dates.map(date=>({date,start,end}))}; }
const lfm=[
 ['balham','Balham','South','Henry Cavendish Primary School, Hydethorpe Road, SW12 0JA',6,'09:00','13:00'],
 ['blackheath','Blackheath','South','Blackheath Station car park, SE3 9LA',0,'10:00','14:00'],
 ['ealing','Ealing','West','Leeland Road, W13 9HH',6,'09:00','13:00'],
 ['highbury','Highbury Fields','North','Highbury Crescent, N5 1RR',0,'10:00','14:00'],
 ['kensington','High Street Kensington','West','Phillimore Walk, W8 7RX',0,'10:00','14:00'],
 ['islington','Islington','North','Chapel Market, N1 9PZ',0,'10:00','14:00'],
 ['marylebone','Marylebone','Central','St Vincent Street and Aybrook Street, W1U 4DF',0,'10:00','14:00'],
 ['notting-hill','Notting Hill','West','Fox Primary School, Edge Street, W8 7PP',6,'10:00','14:00'],
 ['parliament-hill','Parliament Hill','North','William Ellis School, Highgate Road, NW5 1RN',6,'10:00','14:00'],
 ['pimlico-road','Pimlico Road','Central','Orange Square, SW1W 8UT',6,'09:00','14:00'],
 ['queens-park','Queen’s Park','North','Salusbury Primary School, NW6 6RG',0,'10:00','14:00'],
 ['south-kensington','South Kensington','West','Bute Street, SW7 3EX',6,'09:00','14:00'],
 ['swiss-cottage','Swiss Cottage','North','Eton Avenue, NW3 3EU',3,'10:00','15:00'],
 ['twickenham','Twickenham','West','Holly Road Car Park, TW1 4HF',6,'09:00','13:00'],
 ['walthamstow','Walthamstow','East','Town Square, E17 7JN',0,'10:00','14:00'],
 ['west-hampstead','West Hampstead','North','Thameslink Station Forecourt, Iverson Road, NW6 1PF',6,'10:00','14:00'],
 ['wimbledon','Wimbledon','South','Wimbledon Park Primary School, Havana Road, SW19 8EJ',6,'09:00','13:00']
];
for(const batch of Array.from({length:Math.ceil(lfm.length/10)},(_,i)=>lfm.slice(i*10,i*10+10))) {
  for(const [id,name,area,venue,day,start,end] of batch) add(`lfm-${id}`,`${name} Farmers’ Market`,'farmers',area,venue,'lfm',recurring([day],start,end));
}
for(const [id,name,area,venue,day,start,end] of [
 ['herne','Herne Hill Market','South','Station Square, Herne Hill',0,'10:00','16:00'],
 ['oval','Oval Farmers’ Market','South','St Mark’s Church, opposite Oval station',6,'10:00','15:00'],
 ['stepney','Stepney Farmers’ Market','East','Stepney City Farm',6,'10:00','15:00'],
 ['telegraph','Telegraph Hill Market','South','Telegraph Hill Park',6,'10:00','15:00']
]) add(id,name,'farmers',area,venue,'ccfm',recurring([day],start,end));
for(const [id,name,area,venue,day] of [
 ['victoria-park','Victoria Park Market','East','Victoria Park',0], ['lloyd','Lloyd Park Market','East','Lloyd Park, near William Morris Gallery',6], ['crystal-park','Crystal Palace Park Market','South','Crystal Palace Park',0]
]) add(id,name,'farmers',area,venue,'good',recurring([day],'10:00','16:00'),id==='victoria-park'?{image:{src:'/assets/journal/16-food-markets-03.webp',credit:'Paolo Pastorino',alt:{en:'Victoria Park Market beneath the trees',it:'Il mercato di Victoria Park sotto gli alberi'}}}:{});
add('crystal-food','Crystal Palace Food Market','farmers','South','Haynes Lane, SE19','crystal',recurring([6],'10:00','15:00'),{description:{en:'Local and sustainably sourced food, tucked away down Haynes Lane.',it:'Prodotti locali e alimenti da filiere sostenibili, lungo Haynes Lane.'}});
add('brockley','Brockley Market','farmers','South','Lewisham College car park, Lewisham Way, SE4 1UT','brockley',recurring([6],'10:00','14:00'));
add('growing','Growing Communities Farmers’ Market','farmers','North','Stoke Newington','growing',recurring([6],null,null),{description:{en:'Organic food from small farms, with almost all producers within 60 miles of London.',it:'Alimenti biologici di piccole aziende agricole, quasi tutte entro 60 miglia da Londra.'}});
add('surbiton','Surbiton Farmers’ Market','farmers','West','Maple Road, Surbiton','surbiton',recurring([6],'09:00','13:00',{nth:[3]}));
add('kew','Kew Village Market','craft','West','Kew Gardens station, TW9 3PZ','kew',{...recurring([0],'10:00','14:00',{nth:[1],excludeMonths:[1]}),...dated(['2026-12-06'],'10:00','14:00')},{description:{en:'Local food, handmade gifts and live music in Kew village.',it:'Specialità gastronomiche, creazioni artigianali e musica dal vivo a Kew.'}});
add('chiswick-flower','Chiswick Flower Market','flowers','West','Old Market Place, Chiswick High Road, W4 2DR','flower',{...recurring([0],'09:30','15:30',{nth:[1],excludeMonths:[1]}),...dated(['2026-12-06'],'09:30','15:30')});
add('chiswick-cheese','Chiswick Cheese Market','food','West','Old Market Place, Chiswick High Road, W4 2DR','cheese',recurring([0],'09:30','15:00',{nth:[3]}),{description:{en:'Artisan cheeses and accompaniments from independent traders.',it:'Formaggi artigianali e specialità da abbinare, da venditori indipendenti.'}});
add('chiswick-food','The Food Market Chiswick','farmers','West','The Pavilion, Dukes Meadows, W4 2RX','food',recurring([0],'10:00','14:00'));
add('hall-sun','Hall Place Farmers Market','farmers','South','Hall Place, Bourne Road, Bexley','hall',{...recurring([0],'10:00','14:00',{nth:[1]}),dates:[{date:'2026-12-06',start:'10:00',end:'14:00',venue:'East Lawn, Hall Place, Bexley'}]});
add('hall-sat','Hall Place Saturday Farmers Market','farmers','South','Hall Place Courtyard, Bexley','hall',{...recurring([6],'10:00','14:00',{nth:[3]}),...dated(['2026-11-21','2026-12-19'],'10:00','14:00')});
add('chislehurst','Chislehurst Farmers Market','farmers','South','Hornbrook House car park, High Street, BR7 5AB','chislehurst',{...recurring([0],'10:00','14:00',{nth:[3]}),...dated(['2026-12-20'],'10:00','14:00')});
add('wanstead','Wanstead Market','craft','East','Wanstead High Street, E11 2AE','ace',recurring([0],'10:00','16:00',{nth:[1]}));
add('woodford','South Woodford Market','craft','East','George Lane, E18 1AY','ace',recurring([0],'10:00','16:00',{nth:[3],excludeDates:['2026-12-20']}));
add('horniman','Horniman Market','farmers','South','Bandstand Terrace, Horniman Gardens, Forest Hill','horniman',{...recurring([0],null,null),...dated(['2026-12-06'],'10:00','15:00')});
add('canopy','Canopy Market','craft','Central','West Handyside Canopy, King’s Cross, N1C 4BH','canopy',{recurrences:[{...recurring([5],'12:00','20:00').recurrence,from:'2027-01-04'},{...recurring([6,0],'11:00','18:00').recurrence,from:'2027-01-04'}]}, {description:{en:'A covered market for produce, artisan food, designer-makers and original art.',it:'Un mercato coperto con prodotti alimentari, specialità artigianali, design e opere originali.'}});
add('spital-antiques','Old Spitalfields Antiques Market','flea','East','Old Spitalfields Market, 16 Horner Square, E1 6EW','spital',recurring([4],'08:00','17:00'));
add('jubilee-antiques','Jubilee Antiques & Collectables','flea','Central','Jubilee Market, Covent Garden','jubilee',recurring([1],'05:00','17:00'));
add('jubilee-craft','Jubilee Arts & Crafts','craft','Central','Jubilee Market, Covent Garden','jubilee',recurring([6,0],'10:00','18:00'));
add('greenwich','Greenwich Market','craft','South','Greenwich Market','greenwich',recurring([0,1,2,3,4,5,6],'10:00','17:30'),{description:{en:'Arts, crafts, antiques and independent traders. The stall mix varies by day.',it:'Arte, artigianato, antiquariato e venditori indipendenti. I banchi cambiano secondo il giorno.'}});
add('capital','Capital Carboot','carboot','Central','Pimlico Academy, Chichester Street entrance, SW1V 3AT','capital',{recurrences:[recurring([0],'10:00','14:30').recurrence,recurring([6],'10:00','14:30',{nth:[1,2]}).recurrence],...dated(['2026-12-05','2026-12-12'],'10:00','14:30')},{note:{en:'Early entry from 10:00; general entry from 11:30. Check the organiser for admission bands.',it:'Ingresso anticipato dalle 10:00; ingresso generale dalle 11:30. Controlla le fasce di prezzo sul sito.'}});
add('chiswick-boot','Chiswick Car Boot','carboot','West','Chiswick School, Staveley Road, W4 3UN','chiswick',dated(['2026-12-06','2027-02-07','2027-03-07'],'06:30','12:30'));
add('bootyfull','Bootyfull Car Boot','carboot','North','William Ellis School, Highgate Road, NW5 1RN','booty',{recurrences:[{...recurring([0],'11:00','14:00').recurrence,until:'2026-12-13'},{...recurring([0],'11:00','14:00').recurrence,from:'2027-02-07'}],...dated(['2026-12-13','2027-02-07'],'11:00','14:00')});
add('tottenham','Tottenham Car Boot','carboot','North','Tottenham Community Sports Centre, N17 8AD','tottenham',recurring([4],'07:00','13:00'));
add('peckham','Peckham Carboot','carboot','South','Harris Academy, entrance off Bellenden Road, SE15 5DZ','peckham',dated(['2026-11-22'],'10:00','14:00'));
add('balham-boot','Balham Carboot','carboot','South','Henry Cavendish School, Hydethorpe Road, SW12 0JA','balham',dated(['2026-11-29'],'10:00','14:00'));
add('hackney-flea','Hackney Flea Market','flea','North','Stoke Newington Church Street, N16 0AS','hackney',dated(['2026-11-28','2026-11-29','2027-01-09','2027-01-10','2027-02-13','2027-02-14','2027-03-13','2027-03-14'],'10:00','17:00'));
add('thriftmas','Thriftmas Market','flea','North','Stoke Newington Church Street, N16 0AS','hackney',dated(['2026-12-19','2026-12-20'],'10:00','17:00'));
add('giant','The Giant London Flea','flea','East','Queen Elizabeth Olympic Park, E15 2GZ','hackney',dated(['2027-02-07'],'10:00','17:00'));
add('drumsheds','Drumsheds Flea','flea','North','6 Glover Drive, N18 3HF','hackney',dated(['2027-06-06','2027-09-26'],'10:00','16:00'));
add('jewellers','Independent Jewellers Christmas Market','craft','East','Big Penny Social','hackney',dated(['2026-11-29'],'11:00','17:00'));
for(const [id,name,area,venue,dates,start,end] of [
 ['go-doodle','Go East Vintage Flea Weekender','South','Doodle Bar Arches, 60 Druid Street, SE1 2EZ',['2026-11-21','2026-11-22'],'10:00','17:00'],
 ['go-rope','Go East at Ropewalk','South','Ropewalk, Maltby Street, SE1 3PA',['2026-11-27'],'17:30','21:00'],
 ['go-wapping','Go East Vintage Festive Weekender','East','Wapping Power Station, Wapping Wall, E1W 3SF',['2026-12-05','2026-12-06'],'10:00','17:00'],
 ['go-baths','Go East Vintage & Creatives Market','East','Eastway Baths, 80 Eastway, E9 5JH',['2027-01-23'],'14:00','19:00']
]) add(id,name,'flea',area,venue,'go',dated(dates,start,end));
for(const [id,name,area,venue,dates,start,end] of [
 ['duck-richmond','Richmond Duck Pond Market','West','Heron Square, TW9 1EP',['2026-11-21','2026-11-22','2026-11-28','2026-11-29','2026-12-05','2026-12-06','2026-12-12','2026-12-13','2026-12-19','2026-12-20'],'10:30','16:00'],
 ['duck-chiswick','Duck Pond Christmas Market','West','Chiswick House & Gardens, W4 2RP',['2026-12-05','2026-12-06','2026-12-19','2026-12-20','2026-12-21','2026-12-22','2026-12-23','2026-12-24'],'10:00','15:00'],
 ['duck-ruislip','Ruislip Duck Pond Market','West','Manor Farm, Ruislip',['2026-12-05','2026-12-06','2026-12-19','2026-12-20'],'10:00','15:00'],
 ['duck-night','Ruislip Christmas Night Market','West','Manor Farm, Ruislip',['2026-12-04','2026-12-18'],'16:00','21:00'],
 ['duck-highgate','Highgate Extraordinary Artisans','North','Lauderdale House, N6 5HG',['2026-12-12','2026-12-13'],'11:00','17:00'],
 ['duck-gunnersbury','Duck Pond Christmas Market','West','Gunnersbury Park',['2026-12-13'],'10:00','16:00'],
 ['duck-harrow','Artisans at Headstone Museum','West','The Great Barn, Headstone Manor, Harrow',['2026-12-13'],'10:00','15:00']
]) add(id,name,'craft',area,venue,'duck',dated(dates,start,end));
add('fox-rsa','Crafty Fox Christmas Market','craft','Central','RSA House, 8 John Adam Street, WC2N 6EZ','fox',dated(['2026-12-05'],'11:00','17:00'));
add('fox-crossing','Crafty Fox Christmas Market','craft','Central','The Crossing, 1 Granary Square, N1C 4AA','fox',dated(['2026-12-06','2026-12-12','2026-12-13'],'11:00','17:00'));
add('solo-martin','SoLo St Martin’s Christmas Market','craft','Central','St Martin-in-the-Fields, Trafalgar Square, WC2N 4JJ','solo',dated(['2026-11-21','2026-11-22','2026-11-28','2026-11-29'],'11:00','17:00'));
add('solo-southbank','SoLo South Bank Christmas Market','craft','South','The Pier, Between the Bridges, South Bank','solo',dated(['2026-11-22','2026-11-29','2026-12-06','2026-12-13','2026-12-20'],'12:00','17:00'));
add('solo-leadenhall','SoLo Leadenhall Christmas Market','craft','Central','Leadenhall Market','solo',dated(['2026-12-12'],'12:00','17:00'));
const residency=Array.from({length:14},(_,i)=>new Date(Date.UTC(2026,10,23+i)).toISOString().slice(0,10));
add('solo-city','SoLo City of London Christmas Market','craft','Central','1 Sky Garden Walk, EC3M 8AF','solo',dated(residency,'11:00','18:00'));
add('urban-ecology','Urban Makers Christmas Market','craft','East','Ecology Pavilion, 125 Grove Road, E3 5RP','urban',dated(['2026-11-28','2026-11-29','2026-12-12','2026-12-13'],'11:00','17:00'));
add('slc-newcross','So Last Century Vintage Fair','flea','South','Goldsmiths, University of London','slc',dated(['2026-11-29'],'10:30','16:00'));
add('slc-dulwich','So Last Century Christmas Vintage Market','flea','South','Dulwich Picture Gallery','slc',dated(['2026-12-05','2026-12-06'],'10:00','17:00'));
add('lazy','The Lazy Flea Christmas Market','flea','West','Chiswick House & Gardens, W4 2RP','lazy',dated(['2026-12-12','2026-12-13'],'10:30','16:00'),{note:{en:'Early entry 10:30 to 11:30; general entry from 11:30. Check admission prices.',it:'Ingresso anticipato dalle 10:30 alle 11:30; ingresso generale dalle 11:30. Controlla i prezzi.'}});
add('frock','Frock Me! Vintage Fair','flea','West','Chelsea Old Town Hall, King’s Road, SW3 5EE','frock',dated(['2026-12-06'],null,null));
add('feast','West Norwood Feast','craft','South','West Norwood','feast',dated(['2026-12-06'],'10:00','16:00'));
add('feast-christmas','Feast Christmas Market','craft','South','West Norwood Library and Picturehouse','feastx',dated(['2026-12-12'],'11:00','15:00'));
await mkdir('content',{recursive:true});
await writeFile('content/markets.json',JSON.stringify({schemaVersion:1,updated:'2026-11-20',coverageStart:'2026-11-20',coverageEnd:'2027-02-28',timezone:'Europe/London',holidayHold:{from:'2026-12-24',until:'2027-01-03'},markets},null,2)+'\n');
console.log(`Seeded ${markets.length} market series from approved research. Unresolved records excluded.`);
