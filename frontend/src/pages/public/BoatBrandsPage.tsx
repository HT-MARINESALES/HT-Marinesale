import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Anchor, ChevronRight, Ship, Waves, Info } from 'lucide-react';

interface Brand {
  name: string;
  desc: string;
}

const ALL_BRANDS: Record<string, Brand[]> = {
  A: [
    { name: 'A. Mostes', desc: 'Italienische Sportboote mit klassischem Design' },
    { name: 'AB Yachts', desc: 'Luxuriöse Hochgeschwindigkeits-Open-Yachten aus Italien' },
    { name: 'Abacus', desc: 'Motorboote und Tageskreuzer aus Italien' },
    { name: 'Abeking & Rasmussen', desc: 'Deutsche Traditionswerft für Luxusyachten und Spezialschiffe' },
    { name: 'Absolute', desc: 'Italienische Premium-Motoryachten mit modernem Design' },
    { name: 'Adagio Yachts', desc: 'Komfortable Hausboote und Flusskreuzer' },
    { name: 'Adventure', desc: 'Robuste Schlauch- und Angelboote' },
    { name: 'Agder', desc: 'Skandinavische Motorboote für Küste und See' },
    { name: 'Aicon', desc: 'Elegante italienische Motoryachten und Open-Modelle' },
    { name: 'Airon Marine', desc: 'Sportliche Motorboote aus Italien' },
    { name: 'AKA Marine', desc: 'Freizeitboote und Schlauchboote' },
    { name: 'Albin', desc: 'Schwedische Motorboote und Kreuzer' },
    { name: 'Alfastreet', desc: 'Elektrische und solarbetriebene Solarboote' },
    { name: 'Allroundmarin', desc: 'Schlauchboote und Beiboote für jeden Bedarf' },
    { name: 'Altena', desc: 'Niederländische Stahl- und Polyesteryachten' },
    { name: 'Alubat', desc: 'Französische Aluminiumsegelyachten für Blauwasserfahrten' },
    { name: 'AluShip', desc: 'Aluminiumboote für Berufs- und Freizeitschifffahrt' },
    { name: 'Amel', desc: 'Französische Hochseeyachten für Weltumsegler' },
    { name: 'American Marine', desc: 'Klassische amerikanische Motorboote und Yachten' },
    { name: 'AMT', desc: 'Finnische Freizeit- und Angelboote' },
    { name: 'Antaris', desc: 'Niederländische Motorboote für Fluss und Küste' },
    { name: 'Apreamare', desc: 'Klassische neapolitanische Holz- und Laminatboote' },
    { name: 'Aquador', desc: 'Skandinavische Freizeitboote für Familie und Sport' },
    { name: 'Aqualine', desc: 'Niederländische Motorboote und Cabrio-Kreuzer' },
    { name: 'Aquanaut', desc: 'Niederländische Motorkreuzer und Yachten' },
    { name: 'Aquaspirit', desc: 'Schlauchboote und RIBs für Sport und Freizeit' },
    { name: 'Archambault', desc: 'Französische Regatta- und Fahrtensegelyachten' },
    { name: 'Arcoa', desc: 'Französische Motorboote und Kreuzer' },
    { name: 'Arcona', desc: 'Schwedische Performance-Segelyachten' },
    { name: 'Arvor', desc: 'Französische Fischerboote und Tageskreuzer' },
    { name: 'AS Marine', desc: 'Stahl- und Aluminiumyachten aus den Niederlanden' },
    { name: 'Askeladden', desc: 'Norwegische Freizeitboote für Angeln und Küstenfahrten' },
    { name: 'Astondoa', desc: 'Spanische Motoryachten im Premiumsegment' },
    { name: 'Atlantic', desc: 'Robuste skandinavische Angelboote' },
    { name: 'Atlantis', desc: 'Italienische Sportboote und Open-Modelle' },
    { name: 'Aventura Catamarans', desc: 'Komfortable Fahrtenkatamarane für Langfahrt' },
    { name: 'Axopar', desc: 'Finnische Sportboote mit modernem skandinavischen Design' },
    { name: 'Azimut', desc: 'Italienische Luxusmotoryachten der Spitzenklasse' },
  ],
  B: [
    { name: 'Baia', desc: 'Italienische Hochgeschwindigkeits-Sportboote' },
    { name: 'Baja', desc: 'Amerikanische Speedboote und Sportkreuzer' },
    { name: 'Bali Catamarans', desc: 'Moderne Fahrtenkatamarane mit innovativem Design' },
    { name: 'Baltic', desc: 'Finnische Hochleistungs-Segelyachten für Race und Fahrt' },
    { name: 'Bavaria', desc: 'Deutsche Segel- und Motorboote mit gutem Preis-Leistungs-Verhältnis' },
    { name: 'Bayliner', desc: 'Amerikanische Freizeit- und Familienboote weltweit beliebt' },
    { name: 'Bella', desc: 'Finnische Freizeitboote für Familie und Sport' },
    { name: 'Benetti', desc: 'Italienische Superyachten im Luxussegment' },
    { name: 'Bénéteau', desc: 'Französischer Weltmarktführer für Segel- und Motorboote' },
    { name: 'Bertram', desc: 'Amerikanische Sportfischer und Offshore-Yachten' },
    { name: 'Bianca Yachts', desc: 'Niederländische Motorkreuzer und Yachten' },
    { name: 'Birchwood', desc: 'Englische Motorkreuzer für Fluss und Küste' },
    { name: 'Bluegame', desc: 'Sportliche italienische Motoryachten mit offenem Konzept' },
    { name: 'BMA', desc: 'Skandinavische Sportboote und Tageskreuzer' },
    { name: 'Boesch', desc: 'Schweizer Traditionswerft für edle Holzmotorboote' },
    { name: 'Boston Whaler', desc: 'Amerikanische Unsinkbarkeits-Boote für Sport und Angeln' },
    { name: 'Brabus', desc: 'Exklusive Hochleistungs-Sportboote' },
    { name: 'Brig', desc: 'Robuste RIBs und Schlauchboote für Sport und Berufsschifffahrt' },
    { name: 'Broom', desc: 'Britische Motorkreuzer für Fluss und Küstenfahrten' },
    { name: 'Bruno Abbate', desc: 'Italienische Sportboote mit langer Renntradition' },
    { name: 'Buster', desc: 'Finnische Freizeitboote – robust und vielseitig' },
  ],
  C: [
    { name: 'Capelli', desc: 'Italienische RIBs und Schlauchboote' },
    { name: 'Capoforte', desc: 'Sportliche italienische Motorboote' },
    { name: 'Carver', desc: 'Amerikanische Motorkreuzer und Sportboote' },
    { name: 'Catalina', desc: 'Amerikanische Fahrtensegelyachten für Einsteiger und Fortgeschrittene' },
    { name: 'Catana', desc: 'Französische Hochleistungs-Fahrtenkatamarane' },
    { name: 'Chaparral', desc: 'Amerikanische Sportboote und Bowrider' },
    { name: 'Chris Craft', desc: 'Legendäre amerikanische Holz- und Retro-Motorboote' },
    { name: 'Cobalt', desc: 'Premium amerikanische Sportboote und Bowrider' },
    { name: 'Contest', desc: 'Niederländische Qualitäts-Segelyachten für anspruchsvolle Segler' },
    { name: 'Correct Craft', desc: 'Amerikanische Wasserski- und Wakeboard-Boote' },
    { name: 'Cranchi', desc: 'Elegante italienische Motorboote und Sportkreuzer' },
    { name: 'Crownline', desc: 'Amerikanische Familien-Sportboote und Kreuzer' },
    { name: 'Cruisers Yachts', desc: 'Amerikanische Sportkreuzer und Motoryachten' },
  ],
  D: [
    { name: 'De Antonio Yachts', desc: 'Spanische Luxus-Sportboote mit modernem Design' },
    { name: 'Dehler', desc: 'Deutsche Hochleistungs-Regattasegelyachten' },
    { name: 'Delphia', desc: 'Polnische Segel- und Motorboote mit gutem Preis-Leistungs-Verhältnis' },
    { name: 'Dominator', desc: 'Italienische Luxusmotoryachten im Sportlichen Stil' },
    { name: 'Draco', desc: 'Skandinavische Sportboote mit nordischer Qualität' },
    { name: 'Dragonfly', desc: 'Dänische Hochgeschwindigkeits-Trimmarane' },
    { name: 'Dufour', desc: 'Französische Segel- und Motorboote – beliebt bei Fahrtenseglern' },
  ],
  E: [
    { name: 'Elan', desc: 'Slowenische Segelyachten für Regatta und Fahrt' },
    { name: 'Elling', desc: 'Niederländische Hochsee-Motorkreuzer mit großer Reichweite' },
    { name: 'Etap', desc: 'Belgische Unsinkbarkeits-Segelboote' },
    { name: 'Excess', desc: 'Moderne performance-orientierte Katamarane' },
  ],
  F: [
    { name: 'Fairline', desc: 'Britische Luxusmotoryachten und Sportkreuzer' },
    { name: 'Feadship', desc: 'Niederländische Superyachten in Handarbeit gefertigt' },
    { name: 'Ferretti', desc: 'Italienische Luxusmotoryachten mit klassischem Stil' },
    { name: 'Finnmaster', desc: 'Finnische Familienboote und Tageskreuzer' },
    { name: 'Fjord', desc: 'Norwegische Sportboote mit charakteristischem Open-Design' },
    { name: 'Flipper', desc: 'Finnische Freizeit- und Angelboote' },
    { name: 'Fountaine Pajot', desc: 'Französischer Marktführer für Segel- und Motorkatamarane' },
    { name: 'Four Winns', desc: 'Amerikanische Sport- und Familienboote' },
    { name: 'Frauscher', desc: 'Österreichische Elektromotorboote in Premiumqualität' },
  ],
  G: [
    { name: 'Galeon', desc: 'Polnische Sportkreuzer und Motoryachten mit modernem Design' },
    { name: 'Glastron', desc: 'Amerikanische Sportboote und Bowrider für Einsteiger' },
    { name: 'Gobbi', desc: 'Italienische Sport- und Kabinenkreuzer' },
    { name: 'Grand Banks', desc: 'Klassische amerikanische Trawler-Yachten für Langfahrt' },
    { name: 'Grand Soleil', desc: 'Italienische Hochleistungs-Segelyachten' },
    { name: 'Grandezza', desc: 'Finnische Sportboote und Kabinenkreuzer' },
    { name: 'Greenline', desc: 'Slowenische Hybrid- und Solarboote' },
    { name: 'Guy Couach', desc: 'Französische Traditionswerft für Sport- und Patrouillenboote' },
  ],
  H: [
    { name: 'Hallberg-Rassy', desc: 'Schwedische Hochsee-Segelyachten – Maßstab für Qualität' },
    { name: 'Hanse', desc: 'Deutsche Segelboote mit bestem Preis-Leistungs-Verhältnis' },
    { name: 'Hatteras', desc: 'Amerikanische Sportfisch-Yachten und Motorkreuzer' },
    { name: 'Highfield', desc: 'Aluminiumrumpf-RIBs und Schlauchboote' },
    { name: 'Horizon', desc: 'Taiwanesische Motoryachten für Komfort und Reichweite' },
    { name: 'Hunter', desc: 'Amerikanische Segel- und Motorboote für Einsteiger' },
    { name: 'Hydrolift', desc: 'Norwegische Hochgeschwindigkeits-Sportboote' },
  ],
  I: [
    { name: 'ICE Yachts', desc: 'Italienische Hochleistungs-Segelyachten' },
    { name: 'Interboat', desc: 'Niederländische Elektro- und Solarboote für Binnengewässer' },
    { name: 'Invictus', desc: 'Italienische Sportboote mit klassischem Retro-Design' },
    { name: 'Italia Yachts', desc: 'Italienische Performance-Segelyachten' },
  ],
  J: [
    { name: 'J Boats', desc: 'Amerikanische Regatta-Segelyachten mit langer Erfolgstradition' },
    { name: 'Jeanneau', desc: 'Französische Segel- und Motorboote für alle Ansprüche' },
    { name: 'Joker Boat', desc: 'Robuste Schlauchboote und RIBs für Sport und Arbeit' },
  ],
  K: [
    { name: 'Karnic', desc: 'Türkische Sportboote und Motorkreuzer' },
    { name: 'Kolibri', desc: 'Günstige Schlauchboote für Freizeit und Angeln' },
  ],
  L: [
    { name: 'Lagoon', desc: 'Französischer Marktführer für Fahrtenkatamarane' },
    { name: 'Larson', desc: 'Amerikanische Familien-Sportboote' },
    { name: 'Leopard', desc: 'Südafrikanische Fahrtenkatamarane für Blauwasser' },
    { name: 'Linder', desc: 'Schwedische Aluminium-Angelboote und Beiboote' },
    { name: 'Linssen', desc: 'Niederländische Stahlkreuzer für Fluss und Kanal' },
    { name: 'Lomac', desc: 'Italienische RIBs und Schlauchboote' },
  ],
  M: [
    { name: 'Malibu', desc: 'Amerikanische Wasserski- und Wakeboard-Boote' },
    { name: 'Malö Yachts', desc: 'Schwedische Hochsee-Segelyachten in Handwerksqualität' },
    { name: 'Mangusta', desc: 'Italienische Hochgeschwindigkeits-Luxusmotoryachten' },
    { name: 'Marex', desc: 'Schwedische Sportkreuzer mit nordischer Qualität' },
    { name: 'MasterCraft', desc: 'Amerikanische Premium-Wakesurf- und Waterski-Boote' },
    { name: 'Menorquin', desc: 'Spanische Kabinenkreuzer und Yachten' },
    { name: 'Mochi Craft', desc: 'Italienische Retro-Motorboote im Dolcevita-Stil' },
    { name: 'Monte Carlo Yachts', desc: 'Italienische Luxusmotoryachten mit großzügigem Raumangebot' },
    { name: 'Moody', desc: 'Britische Fahrtensegelyachten für anspruchsvolle Segler' },
    { name: 'Mulder', desc: 'Niederländische Stahl-Motoryachten in Traditionshandwerk' },
  ],
  N: [
    { name: 'Najad', desc: 'Schwedische Hochsee-Segelyachten für Langfahrt' },
    { name: 'Nauticat', desc: 'Finnische Kabinenkreuzer-Segelboote für Hochsee' },
    { name: 'Nautitech', desc: 'Französische Performance-Katamarane' },
    { name: "Nautor's Swan", desc: 'Finnische Luxus-Segelyachten der absoluten Spitzenklasse' },
    { name: 'Neptunus', desc: 'Niederländische Motorkreuzer in Qualitätsbauweise' },
    { name: 'Nimbus', desc: 'Schwedische Motorboote und Kombi-Kreuzer' },
  ],
  O: [
    { name: 'Ocean Alexander', desc: 'Taiwanesische Luxus-Motorkreuzer für Langfahrt' },
    { name: 'Ocqueteau', desc: 'Französische Schlauchboote und RIBs' },
    { name: 'Orkney', desc: 'Britische Fischerboote und Freizeitboote' },
    { name: 'Ovation', desc: 'Britische Motorboote für Freizeit und Sport' },
  ],
  P: [
    { name: 'Parker', desc: 'Britische Angelboote und Seegangs-Sportboote' },
    { name: 'Pardo', desc: 'Italienische Deck-Salon-Yachten im modernen Stil' },
    { name: 'Pearlsea', desc: 'Kroatische Holzoptik-Motorboote in klassischem Design' },
    { name: 'Pershing', desc: 'Italienische Hochleistungs-Luxusmotoryachten' },
    { name: 'Pioneer', desc: 'Amerikanische Center-Console- und Angelboote' },
    { name: 'Prestige', desc: 'Französische Luxusmotoryachten mit modernem Interieur' },
    { name: 'Princess', desc: 'Britische Luxusmotoryachten in Premiumklasse' },
    { name: 'Quicksilver', desc: 'Sportliche Motorboote und RIBs für Küste und Sport' },
  ],
  Q: [
    { name: 'Quicksilver', desc: 'Sportliche Motorboote und RIBs für Küste und Sport' },
  ],
  R: [
    { name: 'Regal', desc: 'Amerikanische Sport- und Kabinenboote' },
    { name: 'Riva', desc: 'Legendäre italienische Holz- und Luxusmotorboote' },
    { name: 'Riviera', desc: 'Australische Sport-Motorkreuzer für Küste und Offshore' },
    { name: 'Robalo', desc: 'Amerikanische Angelboote und Center-Console-Modelle' },
    { name: 'Ryds', desc: 'Schwedische Aluminiumboote für Angeln und Freizeit' },
  ],
  S: [
    { name: 'Sargo', desc: 'Finnische Offshore-Motorboote für raue Bedingungen' },
    { name: 'Sea Ray', desc: 'Amerikanischer Marktführer für Sportboote und Yachten' },
    { name: 'Sealine', desc: 'Britische Sportkreuzer und Kabinenboote' },
    { name: 'Sessa Marine', desc: 'Italienische Motorboote für Sport und Freizeit' },
    { name: 'Stingher', desc: 'Italienische Premium-RIBs und Sportboote' },
    { name: 'Storebro', desc: 'Schwedische Traditionswerft für robuste Kabinenboote' },
    { name: 'Sunseeker', desc: 'Britische Luxusmotoryachten mit hohem Glamour-Faktor' },
  ],
  T: [
    { name: 'Tiara', desc: 'Amerikanische Sportkreuzer und Sportfischboote' },
    { name: 'Tofinou', desc: 'Französische klassische Holz-Segelboote in Retro-Optik' },
    { name: 'Topaz', desc: 'Britische Sport-Segelboote und Dinghies' },
    { name: 'Tracker', desc: 'Amerikanische Angelboote und Runabouts' },
  ],
  U: [
    { name: 'Uniesse', desc: 'Italienische Luxusmotoryachten in klassischer Linie' },
    { name: 'Uttern', desc: 'Schwedische Freizeit- und Angelboote' },
  ],
  V: [
    { name: 'Vanquish', desc: 'Niederländische Carbon-Hochgeschwindigkeits-Motorboote' },
    { name: 'Victory', desc: 'Internationale Offshore-Rennboote' },
    { name: 'Viking', desc: 'Amerikanische Sportfisch-Yachten in Premiumklasse' },
  ],
  W: [
    { name: 'Wellcraft', desc: 'Amerikanische Sport- und Fischerboote' },
    { name: 'Westerly', desc: 'Britische robuste Fahrtensegelboote' },
    { name: 'Windy', desc: 'Norwegische Sportboote mit nordischem Qualitätsanspruch' },
  ],
  X: [
    { name: 'X-Yachts', desc: 'Dänische Hochleistungs-Segelyachten für Regatta und Fahrt' },
    { name: 'XO Boats', desc: 'Finnische Offshore-Sportboote mit modernem Design' },
  ],
  Y: [
    { name: 'Yamarin', desc: 'Finnische Motorboote für Angeln, Sport und Familie' },
  ],
  Z: [
    { name: 'Zodiac', desc: 'Weltbekannte Schlauchboote und RIBs – Klassiker der Branche' },
  ],
};

const LETTERS = Object.keys(ALL_BRANDS).sort();
const TOTAL = Object.values(ALL_BRANDS).flat().length;

const INFO_CARDS = [
  {
    icon: Ship,
    title: 'Motorboote & Yachten',
    text: 'Von kompakten Tageskreuzern bis zur Luxusmotoryacht – Marken wie Sea Ray, Sunseeker, Azimut oder Bayliner stehen für unterschiedliche Ansprüche und Preisklassen. Beim Kauf eines Gebrauchtmotorboots spielen Motorstunden, Antriebszustand und Korrosionsschutz die entscheidende Rolle.',
  },
  {
    icon: Waves,
    title: 'Segelboote & Segelyachten',
    text: 'Klassiker wie Hallberg-Rassy, Hanse, Bavaria oder Bénéteau sind auf dem Gebrauchtmarkt besonders verbreitet. Wichtig beim Kauf: Rumpfzustand (Osmose), Rigg, Segel und Seewasserventile sollten sorgfältig geprüft werden – am besten durch einen unabhängigen Gutachter.',
  },
  {
    icon: Info,
    title: 'Warum ein Check-up wichtig ist',
    text: 'Egal welche Marke – ein professionelles Zustandsgutachten schützt Käufer und Verkäufer gleichermaßen. Es deckt versteckte Mängel auf, schafft Transparenz und bildet die Grundlage für eine faire Preisfindung. Bei HT-Marine-Sales ist der Check-up fester Bestandteil jedes Verkaufs.',
  },
];

export function BoatBrandsPage() {
  const [search, setSearch] = useState('');

  const filtered: Record<string, Brand[]> = search.trim().length > 0
    ? Object.fromEntries(
        LETTERS
          .map(l => [l, ALL_BRANDS[l].filter(b =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.desc.toLowerCase().includes(search.toLowerCase())
          )])
          .filter(([, brands]) => (brands as Brand[]).length > 0)
      )
    : ALL_BRANDS;

  const filteredLetters = Object.keys(filtered).sort();
  const filteredTotal = Object.values(filtered).flat().length;

  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #3b82f6 0%, transparent 60%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-5">
            <Anchor className="h-4 w-4 text-blue-300" />
            <span className="text-sm text-blue-200 font-medium">Markenverzeichnis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Bootsmarken von A bis Z
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl leading-relaxed">
            Über <strong className="text-white">{TOTAL} Bootsmarken</strong> mit Kurzbeschreibung –
            von Schlauchbooten über Motorboote bis hin zu Segelyachten und Superyachten.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-blue-300">
            {['Motorboote & Yachten', 'Segelboote', 'Katamarane', 'Schlauchboote & RIBs', 'Sportboote'].map(cat => (
              <span key={cat} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Info Cards ── */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {INFO_CARDS.map(card => (
              <div key={card.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center mb-4">
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2 text-base">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search + Letter Index (sticky) ── */}
      <div className="sticky top-[80px] z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative sm:w-60 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Marke oder Beschreibung suchen…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-9 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1 pb-0.5">
              {LETTERS.map(letter => {
                const available = !!filtered[letter];
                return (
                  <a
                    key={letter}
                    href={available ? `#letter-${letter}` : undefined}
                    onClick={e => !available && e.preventDefault()}
                    className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors
                      ${available
                        ? 'bg-gray-100 text-gray-700 hover:bg-navy-900 hover:text-white cursor-pointer'
                        : 'bg-gray-50 text-gray-300 cursor-default'
                      }`}
                  >
                    {letter}
                  </a>
                );
              })}
            </div>
            <span className="hidden sm:block text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
              {filteredTotal} Marken
            </span>
          </div>
        </div>
      </div>

      {/* ── Brand Directory ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {filteredLetters.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium text-gray-500">Keine Marke gefunden</p>
            <p className="text-sm mt-1">für „{search}"</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredLetters.map(letter => (
              <div key={letter} id={`letter-${letter}`} className="scroll-mt-36">
                {/* Letter header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-navy-900 text-white flex items-center justify-center text-lg sm:text-xl font-black select-none">
                    {letter}
                  </div>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    {(filtered[letter] as Brand[]).length} {(filtered[letter] as Brand[]).length === 1 ? 'Marke' : 'Marken'}
                  </span>
                </div>

                {/* Brand cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(filtered[letter] as Brand[]).map(brand => (
                    <div
                      key={brand.name}
                      className="flex flex-col px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white transition-colors"
                    >
                      <span className="text-sm font-semibold text-navy-900 leading-snug">{brand.name}</span>
                      <span className="text-xs text-gray-500 mt-0.5 leading-relaxed">{brand.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CTA ── */}
        {filteredLetters.length > 0 && (
          <div className="mt-16 rounded-2xl overflow-hidden">
            <div className="bg-navy-900 px-6 sm:px-10 py-10 sm:py-12 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Ihr Boot verkaufen?
                </h2>
                <p className="text-blue-200 text-sm sm:text-base leading-relaxed max-w-md">
                  Egal welche Marke – wir vermarkten Ihr Boot professionell mit unabhängigem
                  Zustandsgutachten. Faire Provision ab 2,5 %.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <Link
                  to="/checkup"
                  className="inline-flex items-center justify-center gap-2 border border-blue-400/40 text-blue-200 hover:text-white hover:border-blue-300 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Mehr zum Check-up
                </Link>
                <Link
                  to="/auth/register"
                  className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  Kostenlos inserieren
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
