'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import routesRaw from '@/data/routes.json';
import { CityInputMulti, allCitiesAlpha } from '@/app/CityInput';

const routes = routesRaw as { from: string; to: string }[];

function sliderLabel(v: number) {
  return v >= 5 ? 'Unlimited' : String(v);
}

export default function Page() {
  const router = useRouter();
  const [froms, setFroms] = useState<string[]>([]);
  const [tos, setTos] = useState<string[]>([]);
  const [slider, setSlider] = useState(2);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'done' | 'denied'>('idle');

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
    const params = new URLSearchParams();
    froms.forEach((f) => params.append('from', f));
    tos.forEach((t) => params.append('to', t));
    params.set('date', date);
    params.set('stops', String(slider));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#00853e] text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <span className="text-3xl font-black tracking-tight">F</span>
          <div>
            <h1 className="text-xl font-bold leading-tight">Frontier Flight Search</h1>
            <p className="text-green-100 text-xs">Find routes with layovers across {routes.length} city pairs</p>
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
        <div className="bg-white rounded-2xl shadow-md p-6">
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
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Frontier Airlines route data — {routes.length} direct city pairs
      </footer>
    </div>
  );
}
