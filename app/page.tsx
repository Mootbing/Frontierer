'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import routesRaw from '@/data/routes.json';
import { CityInputMulti, allCitiesAlpha } from '@/app/CityInput';
import { cityToIata, MONTHS } from '@/lib/frontier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

const routes = routesRaw as { from: string; to: string }[];

const LS_KEY = 'frontier_searches';
const MAX_SAVED = 5;

type SavedSearch = {
  froms: string[];
  tos: string[];
  date: string;
  slider: number;
  savedAt: number;
};

function loadSaved(): SavedSearch[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveSearh(search: SavedSearch) {
  const existing = loadSaved().filter(
    (s) =>
      s.froms.join(',') !== search.froms.join(',') ||
      s.tos.join(',') !== search.tos.join(',') ||
      s.date !== search.date ||
      s.slider !== search.slider
  );
  const updated = [search, ...existing].slice(0, MAX_SAVED);
  localStorage.setItem(LS_KEY, JSON.stringify(updated));
  return updated;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${MONTHS[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
}

function sliderLabel(v: number) {
  return v >= 5 ? 'Unlimited' : String(v);
}

function IataList({ cities }: { cities: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {cities.map((c) => (
        <span key={c} className="font-mono text-xs font-bold bg-noir-raised text-foreground border border-noir-border px-1.5 py-0.5 rounded">
          {cityToIata[c] ?? c}
        </span>
      ))}
    </span>
  );
}

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [froms, setFroms] = useState<string[]>([]);
  const [tos, setTos] = useState<string[]>([]);
  const [slider, setSlider] = useState(2);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');
  const [pastSearches, setPastSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    setPastSearches(loadSaved());
  }, []);

  // Populate form fields from URL parameters
  useEffect(() => {
    const validCities = new Set(allCitiesAlpha);
    const fromParams = searchParams.getAll('from').filter((c) => validCities.has(c));
    const toParams = searchParams.getAll('to').filter((c) => validCities.has(c));
    const dateParam = searchParams.get('date');
    const stopsParam = searchParams.get('stops');

    if (fromParams.length > 0) setFroms(fromParams);
    if (toParams.length > 0) setTos(toParams);
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) setDate(dateParam);
    if (stopsParam) {
      const v = Math.min(5, Math.max(1, parseInt(stopsParam)));
      if (!isNaN(v)) setSlider(v);
    }
  }, [searchParams]);

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
    if (froms.length === 0) { setError('Please select at least one departure city.'); return; }
    if (tos.length === 0) { setError('Please select at least one destination city.'); return; }
    const search: SavedSearch = { froms, tos, date, slider, savedAt: Date.now() };
    setPastSearches(saveSearh(search));
    const params = new URLSearchParams();
    froms.forEach((f) => params.append('from', f));
    tos.forEach((t) => params.append('to', t));
    params.set('date', date);
    params.set('stops', String(slider));
    router.push(`/search?${params.toString()}`);
  }

  function applyPastSearch(s: SavedSearch) {
    setFroms(s.froms);
    setTos(s.tos);
    setDate(s.date);
    setSlider(s.slider);
    setError('');
  }

  function deletePastSearch(idx: number) {
    const updated = pastSearches.filter((_, i) => i !== idx);
    setPastSearches(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-noir-surface border-b border-noir-border shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <span className="text-3xl font-black tracking-tight text-[#00853e]">F</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Frontier Flight Search</h1>
            <p className="text-muted-foreground text-xs">Find routes with layovers across {routes.length} city pairs</p>
          </div>
          {geoStatus === 'loading' && (
            <span className="ml-auto text-xs text-muted-foreground animate-pulse">Getting your location…</span>
          )}
          {geoStatus === 'done' && userCoords && (
            <span className="ml-auto text-xs text-muted-foreground">Showing distances from your location</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <CityInputMulti
                id="from"
                label="From"
                values={froms}
                onChange={setFroms}
                userCoords={userCoords}
                suggestCoords={userCoords}
              />
              <CityInputMulti
                id="to"
                label="To"
                values={tos}
                onChange={setTos}
                userCoords={userCoords}
              />
            </div>

            <div className="mb-5">
              <Label htmlFor="travel-date" className="block text-sm font-semibold mb-1">Travel Date</Label>
              <Input
                id="travel-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-noir-raised border-noir-border focus-visible:ring-[#00853e] w-auto"
              />
            </div>

            <div className="mb-5">
              <Label className="block text-sm font-semibold mb-2">
                Max Stops:{' '}
                <span className="text-[#00853e] font-bold">{sliderLabel(slider)}</span>
              </Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[slider]}
                onValueChange={([v]) => setSlider(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>Unlimited</span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              onClick={handleSearch}
              className="w-full bg-[#00853e] hover:bg-noir-green-dim text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
            >
              Find Routes
            </Button>

            {pastSearches.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Past Searches</p>
                <div className="flex flex-col gap-2">
                  {pastSearches.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 border border-noir-border rounded-xl px-4 py-3 hover:bg-[#00853e]/5 hover:border-[#00853e]/50 transition-colors cursor-pointer group"
                      onClick={() => applyPastSearch(s)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <IataList cities={s.froms} />
                          <span className="text-muted-foreground text-xs">→</span>
                          <IataList cities={s.tos} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.date)} · {sliderLabel(s.slider)} stop{s.slider !== 1 ? 's' : ''} max
                        </p>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-red-400 transition-colors text-sm shrink-0 px-1"
                        onClick={(e) => { e.stopPropagation(); deletePastSearch(i); }}
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="text-center text-xs text-muted-foreground py-6">
        Frontier Airlines route data — {routes.length} direct city pairs
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
