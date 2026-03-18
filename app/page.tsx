'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import routesRaw from '@/data/routes.json';
import { getAllCities, buildAdjacency, findPaths, type Path } from '@/lib/pathfinder';
import { haversineKm, cityCoords } from '@/lib/coords';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400 text-sm">Loading map…</span>
    </div>
  ),
});

const routes = routesRaw as { from: string; to: string }[];
const allCitiesAlpha = getAllCities(routes);

const cityToIata: Record<string, string> = {
  'Aguadilla': 'BQN',
  'Atlanta, GA': 'ATL',
  'Austin, TX': 'AUS',
  'Baltimore, MD': 'BWI',
  'Bentonville/Fayetteville, AR': 'XNA',
  'Boise, ID': 'BOI',
  'Boston, MA': 'BOS',
  'Buffalo, NY': 'BUF',
  'Burbank': 'BUR',
  'Cabo San Lucas': 'SJD',
  'Cancun, MX': 'CUN',
  'Cedar Rapids, IA': 'CID',
  'Charleston, SC': 'CHS',
  'Charlotte, NC': 'CLT',
  'Chicago, IL': 'ORD',
  'Cincinnati, OH': 'CVG',
  'Cleveland, OH': 'CLE',
  'Columbus, OH': 'CMH',
  'Corpus Christi': 'CRP',
  'Dallas, TX': 'DFW',
  'Denver, CO': 'DEN',
  'Des Moines, IA': 'DSM',
  'Detroit, MI': 'DTW',
  'El Paso, TX': 'ELP',
  'Fargo, ND': 'FAR',
  'Fort Lauderdale, FL': 'FLL',
  'Fort Myers, FL': 'RSW',
  'Grand Rapids, MI': 'GRR',
  'Guatemala City': 'GUA',
  'Harrisburg, PA': 'MDT',
  'Hartford, CT': 'BDL',
  'Houston, TX': 'IAH',
  'Indianapolis, IN': 'IND',
  'Islip, NY': 'ISP',
  'Jacksonville, FL': 'JAX',
  'Kansas City, MO': 'MCI',
  'Knoxville, TN': 'TYS',
  'Las Vegas, NV': 'LAS',
  'Little Rock, AR': 'LIT',
  'Los Angeles, CA': 'LAX',
  'Madison, WI': 'MSN',
  'Memphis, TN': 'MEM',
  'Miami, FL': 'MIA',
  'Milwaukee, WI': 'MKE',
  'Minneapolis/St. Paul, MN': 'MSP',
  'Montego Bay, Jamaica': 'MBJ',
  'Myrtle Beach, SC': 'MYR',
  'Nashville, TN': 'BNA',
  'Nassau': 'NAS',
  'New Orleans, LA': 'MSY',
  'New York City, NY': 'LGA',
  'Newark, NJ': 'EWR',
  'Norfolk, VA': 'ORF',
  'Oklahoma City, OK': 'OKC',
  'Omaha, NE': 'OMA',
  'Ontario/LA, CA': 'ONT',
  'Oranjestad, Aruba': 'AUA',
  'Orlando, FL': 'MCO',
  'Pensacola, FL': 'PNS',
  'Philadelphia, PA': 'PHL',
  'Phoenix, AZ': 'PHX',
  'Pittsburgh, PA': 'PIT',
  'Ponce': 'PSE',
  'Portland, OR': 'PDX',
  'Providenciales': 'PLS',
  'Puerto Vallarta, Mexico': 'PVR',
  'Punta Cana, Dominican Republic': 'PUJ',
  'Raleigh, NC': 'RDU',
  'Reno, NV': 'RNO',
  'Richmond': 'RIC',
  'Sacramento, CA': 'SMF',
  'Salt Lake City, UT': 'SLC',
  'San Antonio, TX': 'SAT',
  'San Diego, CA': 'SAN',
  'San Francisco, CA': 'SFO',
  'San Jose, CA': 'SJC',
  'San Jose, CR': 'SJO',
  'San Juan, PR': 'SJU',
  'San Pedro Sula': 'SAP',
  'San Salvador': 'SAL',
  'Santa Ana, CA': 'SNA',
  'Santiago de los Caballeros': 'STI',
  'Santo Domingo': 'SDQ',
  'Sarasota, FL': 'SRQ',
  'Seattle, WA': 'SEA',
  'Sioux Falls, SD': 'FSD',
  'Spokane, WA': 'GEG',
  'St. Louis, MO': 'STL',
  'St. Maarten': 'SXM',
  'Syracuse, NY': 'SYR',
  'Tampa, FL': 'TPA',
  'Trenton, NJ': 'TTN',
  'Tucson, AZ': 'TUS',
  'Tulsa, OK': 'TUL',
  'Washington, D.C.': 'IAD',
  'West Palm Beach, FL': 'PBI',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildFrontierUrl(from: string, to: string, date: string): string {
  const o1 = cityToIata[from];
  const d1 = cityToIata[to];
  if (!o1 || !d1 || !date) return '';
  const [year, month, day] = date.split('-');
  const monthName = MONTHS[parseInt(month) - 1];
  const dd1 = encodeURIComponent(`${monthName} ${parseInt(day)}, ${year}`);
  return `https://booking.flyfrontier.com/Flight/InternalSelect?o1=${o1}&d1=${d1}&dd1=${dd1}&ADT=1&mon=true&promo=&ftype=DD`;
}

function CityInput({
  id,
  label,
  value,
  onChange,
  userCoords,
  sortByDistance,
  suggestFrom,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  userCoords: [number, number] | null;
  sortByDistance: boolean;
  suggestFrom?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  // 5 nearest airports to suggestFrom city (only for To field)
  const suggested = useMemo(() => {
    if (!suggestFrom || !cityCoords[suggestFrom]) return [];
    const ref = cityCoords[suggestFrom];
    return allCitiesAlpha
      .filter((c) => c !== suggestFrom && cityCoords[c])
      .map((c) => ({
        city: c,
        iata: cityToIata[c],
        distMi: Math.round(haversineKm(ref[0], ref[1], cityCoords[c][0], cityCoords[c][1]) * 0.621371),
      }))
      .sort((a, b) => a.distMi - b.distMi)
      .slice(0, 5);
  }, [suggestFrom]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = allCitiesAlpha.map((city) => {
      const iata = cityToIata[city];
      let distMi: number | null = null;
      if (userCoords && cityCoords[city]) {
        const km = haversineKm(userCoords[0], userCoords[1], cityCoords[city][0], cityCoords[city][1]);
        distMi = Math.round(km * 0.621371);
      }
      return { city, iata, distMi };
    });
    if (q) {
      list = list.filter(
        (o) => o.city.toLowerCase().includes(q) || (o.iata && o.iata.toLowerCase().startsWith(q))
      );
    }
    if (sortByDistance && userCoords) {
      list = [...list].sort((a, b) => (a.distMi ?? Infinity) - (b.distMi ?? Infinity));
    }
    return list;
  }, [query, userCoords, sortByDistance]);

  function select(city: string) {
    setQuery(city);
    onChange(city);
    setOpen(false);
  }

  const showSuggested = !query && suggested.length > 0;

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <input
        id={id}
        type="text"
        value={query}
        autoComplete="off"
        placeholder="City or airport code…"
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        onChange={(e) => { setQuery(e.target.value); onChange(''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (showSuggested || filtered.length > 0) && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-72 overflow-auto">
          {showSuggested && (
            <>
              <li className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                Suggested
              </li>
              {suggested.map((opt) => (
                <li
                  key={opt.city}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-800 flex items-center justify-between gap-2"
                  onMouseDown={() => select(opt.city)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.iata && (
                      <span className="text-xs font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded shrink-0">
                        {opt.iata}
                      </span>
                    )}
                    <span className="truncate text-gray-800">{opt.city}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{opt.distMi.toLocaleString()} mi</span>
                </li>
              ))}
              {filtered.length > 0 && (
                <li className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-t border-gray-100">
                  All airports
                </li>
              )}
            </>
          )}
          {filtered.map((opt) => (
            <li
              key={opt.city}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-green-50 hover:text-green-800 flex items-center justify-between gap-2"
              onMouseDown={() => select(opt.city)}
            >
              <div className="flex items-center gap-2 min-w-0">
                {opt.iata && (
                  <span className="text-xs font-mono font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded shrink-0">
                    {opt.iata}
                  </span>
                )}
                <span className="truncate text-gray-800">{opt.city}</span>
              </div>
              {sortByDistance && opt.distMi !== null && (
                <span className="text-xs text-gray-400 shrink-0">{opt.distMi.toLocaleString()} mi</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PathCard({
  path,
  index,
  date,
  selected,
  onClick,
}: {
  path: Path;
  index: number;
  date: string;
  selected: boolean;
  onClick: () => void;
}) {
  const origin = path.stops[0];
  const destination = path.stops[path.stops.length - 1];
  const bookingUrl = buildFrontierUrl(origin, destination, date);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={`bg-white rounded-xl p-4 cursor-pointer transition-all outline-none
        ${selected
          ? 'border-2 border-[#00853e] shadow-md ring-2 ring-[#00853e]/10'
          : 'border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 tracking-wide font-medium">Route #{index + 1}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          path.layovers === 0 ? 'bg-green-100 text-green-700' :
          path.layovers === 1 ? 'bg-blue-100 text-blue-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          {path.layovers === 0 ? 'Direct' : `${path.layovers} stop${path.layovers > 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        {path.stops.map((stop, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="font-mono text-sm font-bold text-gray-700">
              {cityToIata[stop] ?? stop}
            </span>
            {i < path.stops.length - 1 && (
              <span className="text-gray-300 text-xs">›</span>
            )}
          </span>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3 leading-relaxed">{path.stops.join(' · ')}</p>

      <div className="flex items-center justify-between">
        <span className={`text-xs ${selected ? 'text-[#00853e] font-semibold' : 'text-gray-300'}`}>
          {selected ? '● Shown on map' : '○ Click to view on map'}
        </span>
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00853e] text-white hover:bg-[#005c2b] transition-colors"
          >
            Book ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [maxLayovers, setMaxLayovers] = useState(3);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [results, setResults] = useState<Path[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');
  const [hasSearched, setHasSearched] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);

  const adj = useMemo(() => buildAdjacency(routes), []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserCoords([pos.coords.latitude, pos.coords.longitude]); setGeoStatus('done'); },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    );
  }, []);

  function handleSearch() {
    setError('');
    if (!from) { setError('Please select a departure city.'); return; }
    if (!to) { setError('Please select a destination city.'); return; }
    if (from === to) { setError('Departure and destination must be different.'); return; }
    if (!allCitiesAlpha.includes(from)) { setError(`"${from}" is not a valid Frontier city.`); return; }
    if (!allCitiesAlpha.includes(to)) { setError(`"${to}" is not a valid Frontier city.`); return; }
    setLoading(true);
    setTimeout(() => {
      const paths = findPaths(adj, from, to, maxLayovers);
      setResults(paths);
      setLoading(false);
      setHasSearched(true);
      setMenuOpen(false);
      setSelectedPath(null);
    }, 0);
  }

  // Shared form content used in both pre-search and hamburger dropdown
  const searchFormContent = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <CityInput id="from" label="From" value={from} onChange={setFrom} userCoords={userCoords} sortByDistance={true} />
        <CityInput id="to" label="To" value={to} onChange={setTo} userCoords={userCoords} sortByDistance={false} suggestFrom={from} />
      </div>
      <div className="mb-5">
        <label htmlFor="travel-date" className="block text-sm font-semibold text-gray-700 mb-1">Travel Date</label>
        <input
          id="travel-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Max Layovers:{' '}
          <span className="text-green-600 font-bold">
            {maxLayovers === 0 ? 'Direct only' : maxLayovers >= 10 ? `${maxLayovers} (unlimited)` : maxLayovers}
          </span>
        </label>
        <input
          type="range" min={0} max={10} value={maxLayovers}
          onChange={(e) => setMaxLayovers(+e.target.value)}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Direct</span><span>1</span><span>2</span><span>3</span><span>4</span>
          <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>Unlimited</span>
        </div>
      </div>
      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        onClick={handleSearch}
        disabled={loading}
        className="w-full bg-[#00853e] hover:bg-[#005c2b] disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
      >
        {loading ? 'Searching…' : 'Find Routes'}
      </button>
    </>
  );

  // ── PRE-SEARCH VIEW ──────────────────────────────────────────────────────
  if (!hasSearched) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#00853e] text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
            <span className="text-3xl font-black tracking-tight">F</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Frontier Flight Search</h1>
              <p className="text-green-100 text-xs">Find routes with layovers across 854 city pairs</p>
            </div>
            {geoStatus === 'loading' && (
              <span className="ml-auto text-xs text-green-200 animate-pulse">Getting your location…</span>
            )}
            {geoStatus === 'done' && userCoords && (
              <span className="ml-auto text-xs text-green-200">Showing distances from your location</span>
            )}
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            {searchFormContent}
          </div>
        </main>
        <footer className="text-center text-xs text-gray-400 py-6">
          Frontier Airlines route data — {routes.length} direct city pairs
        </footer>
      </div>
    );
  }

  // ── POST-SEARCH SPLIT-SCREEN VIEW ────────────────────────────────────────
  const directCount = results?.filter((p) => p.layovers === 0).length ?? 0;
  const withLayovers = results?.filter((p) => p.layovers > 0).length ?? 0;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">

      {/* Topbar */}
      <header className="h-14 shrink-0 bg-[#00853e] text-white flex items-center px-4 gap-3 shadow-md z-30">
        <span className="text-2xl font-black tracking-tight">F</span>
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-sm font-bold leading-tight">Frontier Flight Search</h1>
          <p className="text-green-200 text-xs truncate">{from} → {to}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {results && results.length > 0 && (
            <span className="text-xs text-green-200 hidden md:block">
              {results.length} route{results.length !== 1 ? 's' : ''} found
            </span>
          )}
          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col justify-center items-center gap-1.5 w-9 h-9 rounded-lg hover:bg-[#005c2b] transition-colors"
            aria-label="Toggle search"
          >
            <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-200 origin-center ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-200 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white rounded transition-all duration-200 origin-center ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {/* Hamburger dropdown + backdrop */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-14 right-0 z-50 bg-white shadow-2xl rounded-bl-2xl p-6 w-full sm:w-[380px] max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <h2 className="text-sm font-bold text-gray-700 mb-5">Modify Search</h2>
            {searchFormContent}
          </div>
        </>
      )}

      {/* Split screen */}
      <div className="flex-1 flex overflow-hidden">

        {/* Map — left half */}
        <div className="w-1/2 relative">
          <MapView selectedPath={selectedPath} />
        </div>

        {/* Results — right half */}
        <div className="w-1/2 overflow-y-auto bg-gray-50 border-l border-gray-200">
          <div className="p-4">

            {/* Stats row */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-800">
                {loading ? 'Searching…' :
                  results === null ? '' :
                  results.length === 0 ? 'No routes found' :
                  `${results.length} route${results.length !== 1 ? 's' : ''} found`}
              </h2>
              {!loading && results && results.length > 0 && (
                <div className="flex gap-1.5">
                  {directCount > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                      {directCount} direct
                    </span>
                  )}
                  {withLayovers > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                      {withLayovers} w/ stops
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Map legend */}
            {selectedPath && (
              <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-4 text-xs text-green-800">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#00853e] ring-2 ring-white ring-offset-1" />
                  Origin
                </span>
                {selectedPath.layovers > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#f97316] ring-2 ring-white ring-offset-1" />
                    Layover
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#1d4ed8] ring-2 ring-white ring-offset-1" />
                  Destination
                </span>
              </div>
            )}

            {/* Route cards */}
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Searching…</div>
            ) : results === null ? null : results.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">✈️</p>
                <p className="font-semibold">No routes found</p>
                <p className="text-sm mt-1">Try increasing max layovers or check city names.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((path, i) => (
                  <PathCard
                    key={i}
                    path={path}
                    index={i}
                    date={date}
                    selected={selectedPath === path}
                    onClick={() => setSelectedPath(selectedPath === path ? null : path)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
