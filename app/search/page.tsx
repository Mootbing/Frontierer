'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import routesRaw from '@/data/routes.json';
import { buildAdjacency, findPaths, type Path } from '@/lib/pathfinder';
import { cityToIata, buildFrontierUrl } from '@/lib/frontier';
import { CityInputMulti, allCitiesAlpha } from '@/app/CityInput';
import { haversineKm, cityCoords } from '@/lib/coords';

const routes = routesRaw as { from: string; to: string }[];

const MapView = dynamic(() => import('@/app/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400 text-sm">Loading map…</span>
    </div>
  ),
});

function sliderLabel(v: number) {
  return v >= 5 ? 'Unlimited' : String(v);
}
function sliderToMaxLayovers(v: number) {
  return v >= 5 ? 10 : v;
}

type RouteGroup = {
  from: string;
  to: string;
  paths: Path[];
};

function groupPathsByRoute(paths: Path[]): RouteGroup[] {
  const map = new Map<string, RouteGroup>();
  for (const path of paths) {
    const from = path.stops[0];
    const to = path.stops[path.stops.length - 1];
    const key = `${from}|${to}`;
    if (!map.has(key)) map.set(key, { from, to, paths: [] });
    map.get(key)!.paths.push(path);
  }
  return Array.from(map.values());
}

function pathDistanceKm(path: Path): number {
  let total = 0;
  for (let i = 0; i < path.stops.length - 1; i++) {
    const a = cityCoords[path.stops[i]];
    const b = cityCoords[path.stops[i + 1]];
    if (a && b) total += haversineKm(a[0], a[1], b[0], b[1]);
  }
  return total;
}

function layoverBadgeClass(layovers: number) {
  if (layovers === 0) return 'bg-green-100 text-green-700';
  if (layovers === 1) return 'bg-blue-100 text-blue-700';
  return 'bg-orange-100 text-orange-700';
}

function layoverLabel(layovers: number) {
  if (layovers === 0) return 'Direct';
  return `${layovers} stop${layovers > 1 ? 's' : ''}`;
}

function RouteRow({
  path,
  selected,
  onSelect,
}: {
  path: Path;
  selected: boolean;
  onSelect: () => void;
}) {
  const distMi = Math.round(pathDistanceKm(path) * 0.621371);
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors
        ${selected
          ? 'bg-green-50 border-l-2 border-[#00853e]'
          : 'hover:bg-gray-50 border-l-2 border-transparent'
        }`}
    >
      <span className="flex flex-wrap items-center gap-0.5 flex-1 min-w-0">
        {path.stops.map((stop, i) => (
          <span key={i} className="flex items-center gap-0.5">
            <span className="font-mono text-sm font-bold text-gray-700">
              {cityToIata[stop] ?? stop}
            </span>
            {i < path.stops.length - 1 && (
              <span className="text-gray-300 text-xs">›</span>
            )}
          </span>
        ))}
      </span>
      <span className="text-xs text-gray-400 shrink-0">{distMi.toLocaleString()} mi</span>
      <span className={`text-xs shrink-0 ${selected ? 'text-[#00853e] font-semibold' : 'text-gray-300'}`}>
        {selected ? '●' : '○'}
      </span>
    </button>
  );
}

function LayoverSection({
  layovers,
  paths,
  selectedPath,
  onSelectPath,
}: {
  layovers: number;
  paths: Path[];
  selectedPath: Path | null;
  onSelectPath: (path: Path | null) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${layoverBadgeClass(layovers)}`}>
          {layoverLabel(layovers)}
        </span>
        <span className="text-xs text-gray-400">
          {paths.length} route{paths.length !== 1 ? 's' : ''} {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div>
          {paths.map((path, i) => (
            <RouteRow
              key={i}
              path={path}
              selected={selectedPath === path}
              onSelect={() => onSelectPath(selectedPath === path ? null : path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RouteGroupCard({
  group,
  date,
  selectedPath,
  onSelectPath,
}: {
  group: RouteGroup;
  date: string;
  selectedPath: Path | null;
  onSelectPath: (path: Path | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const fromIata = cityToIata[group.from] ?? group.from;
  const toIata = cityToIata[group.to] ?? group.to;
  const bookingUrl = buildFrontierUrl(group.from, group.to, date);
  const hasSelected = group.paths.some((p) => p === selectedPath);

  const layoverMap = new Map<number, Path[]>();
  for (const path of group.paths) {
    if (!layoverMap.has(path.layovers)) layoverMap.set(path.layovers, []);
    layoverMap.get(path.layovers)!.push(path);
  }
  for (const paths of layoverMap.values()) {
    paths.sort((a, b) => pathDistanceKm(a) - pathDistanceKm(b));
  }
  const layoverGroups = Array.from(layoverMap.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden transition-all
        ${hasSelected
          ? 'border-2 border-[#00853e] shadow-md'
          : 'border border-gray-200 shadow-sm'
        }`}
    >
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-gray-800">{fromIata}</span>
              <span className="text-gray-400 text-lg">→</span>
              <span className="font-mono text-xl font-black text-gray-800">{toIata}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {group.from} → {group.to}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bookingUrl && (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00853e] text-white hover:bg-[#005c2b] transition-colors"
              >
                Book ↗
              </a>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {group.paths.length} route{group.paths.length !== 1 ? 's' : ''} {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible layover sections */}
      {expanded && (
        <div>
          {layoverGroups.map(([layovers, paths]) => (
            <LayoverSection
              key={layovers}
              layovers={layovers}
              paths={paths}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const fromParams = searchParams.getAll('from');
  const toParams = searchParams.getAll('to');
  const dateParam = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const sliderParam = Math.min(5, Math.max(1, parseInt(searchParams.get('stops') ?? '2')));

  const [froms, setFroms] = useState<string[]>(fromParams);
  const [tos, setTos] = useState<string[]>(toParams);
  const [date, setDate] = useState(dateParam);
  const [slider, setSlider] = useState(sliderParam);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [selectedPath, setSelectedPath] = useState<Path | null>(null);
  const [results, setResults] = useState<Path[] | null>(null);
  const [loading, setLoading] = useState(false);

  const adj = useMemo(() => buildAdjacency(routes), []);

  useEffect(() => {
    setFroms(fromParams);
    setTos(toParams);
    setDate(dateParam);
    setSlider(sliderParam);
  }, [fromParams.join(','), toParams.join(','), dateParam, sliderParam]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (fromParams.length === 0 || toParams.length === 0) { setResults(null); return; }
    setLoading(true);
    setSelectedPath(null);
    const timer = setTimeout(() => {
      const seen = new Set<string>();
      const allPaths: Path[] = [];
      for (const from of fromParams) {
        for (const to of toParams) {
          if (from === to || !allCitiesAlpha.includes(from) || !allCitiesAlpha.includes(to)) continue;
          for (const p of findPaths(adj, from, to, sliderToMaxLayovers(sliderParam))) {
            const key = p.stops.join('→');
            if (!seen.has(key)) { seen.add(key); allPaths.push(p); }
          }
        }
      }
      allPaths.sort((a, b) => a.layovers - b.layovers || a.stops.length - b.stops.length);
      setResults(allPaths);
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [adj, fromParams.join(','), toParams.join(','), sliderParam]);

  function handleSearch() {
    setError('');
    if (froms.length === 0) { setError('Please select at least one departure city.'); return; }
    if (tos.length === 0) { setError('Please select at least one destination city.'); return; }
    const params = new URLSearchParams();
    froms.forEach((f) => params.append('from', f));
    tos.forEach((t) => params.append('to', t));
    params.set('date', date);
    params.set('stops', String(slider));
    router.push(`/search?${params.toString()}`);
    setMenuOpen(false);
  }

  const directCount = results?.filter((p) => p.layovers === 0).length ?? 0;
  const withLayovers = results?.filter((p) => p.layovers > 0).length ?? 0;
  const groups = results ? groupPathsByRoute(results) : [];

  const searchForm = (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <CityInputMulti id="s-from" label="From" values={froms} onChange={setFroms} userCoords={userCoords} suggestCoords={userCoords} />
        <CityInputMulti id="s-to" label="To" values={tos} onChange={setTos} userCoords={userCoords} />
      </div>
      <div className="mb-5">
        <label htmlFor="s-date" className="block text-sm font-semibold text-gray-700 mb-1">Travel Date</label>
        <input
          id="s-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
        />
      </div>
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Max Stops:{' '}
          <span className="text-green-600 font-bold">{sliderLabel(slider)}</span>
        </label>
        <input
          type="range" min={1} max={5} value={slider}
          onChange={(e) => setSlider(+e.target.value)}
          className="w-full accent-green-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>Unlimited</span>
        </div>
      </div>
      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        onClick={handleSearch}
        className="w-full bg-[#00853e] hover:bg-[#005c2b] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
      >
        Find Routes
      </button>
    </>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Topbar */}
      <header className="h-14 shrink-0 bg-[#00853e] text-white flex items-center px-4 gap-3 shadow-md z-30 relative">
        <a href="/" className="text-2xl font-black tracking-tight hover:opacity-80 transition-opacity">F</a>
        <div className="min-w-0 hidden sm:block">
          <h1 className="text-sm font-bold leading-tight">Frontier Flight Search</h1>
          {fromParams.length > 0 && toParams.length > 0 && (
            <p className="text-green-200 text-xs truncate">
              {fromParams.map((c) => (cityToIata as Record<string,string>)[c] ?? c).join(', ')} → {toParams.map((c) => (cityToIata as Record<string,string>)[c] ?? c).join(', ')}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {!loading && results && results.length > 0 && (
            <span className="text-xs text-green-200 hidden md:block">
              {results.length} route{results.length !== 1 ? 's' : ''} found
            </span>
          )}
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

      {/* Hamburger dropdown — fixed so it sits above Leaflet's stacking context */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-14 right-0 z-50 bg-white shadow-2xl rounded-bl-2xl p-6 w-full sm:w-[380px] max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <h2 className="text-sm font-bold text-gray-700 mb-5">Modify Search</h2>
            {searchForm}
          </div>
        </>
      )}

      {/* Split screen */}
      <div className="flex-1 flex overflow-hidden">

        {/* Map — left half */}
        <div className="w-1/2 relative">
          <MapView selectedPath={selectedPath} results={results} />
        </div>

        {/* Results — right half */}
        <div className="w-1/2 overflow-y-auto bg-gray-50 border-l border-gray-200">
          <div className="p-4">

            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-800">
                {loading ? 'Searching…' :
                  results === null ? 'Enter a search above' :
                  results.length === 0 ? 'No routes found' :
                  `${groups.length} flight${groups.length !== 1 ? 's' : ''} · ${results.length} route${results.length !== 1 ? 's' : ''}`}
              </h2>
              {!loading && results && results.length > 0 && (
                <div className="flex gap-1.5">
                  {directCount > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                      {directCount} direct
                    </span>
                  )}
                  {[1, 2].map((n) => {
                    const count = results.filter((p) => p.layovers === n).length;
                    return count > 0 ? (
                      <span key={n} className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        {count} · {n} stop{n > 1 ? 's' : ''}
                      </span>
                    ) : null;
                  })}
                  {(() => {
                    const count = results.filter((p) => p.layovers >= 3).length;
                    return count > 0 ? (
                      <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                        {count} · 3+ stops
                      </span>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

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

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Searching…</div>
            ) : results === null ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Use the search above to find routes.
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">✈️</p>
                <p className="font-semibold">No routes found</p>
                <p className="text-sm mt-1">Try increasing max stops or check city names.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {groups.map((group, i) => (
                  <RouteGroupCard
                    key={i}
                    group={group}
                    date={dateParam}
                    selectedPath={selectedPath}
                    onSelectPath={setSelectedPath}
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
    }>
      <SearchContent />
    </Suspense>
  );
}
