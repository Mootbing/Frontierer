'use client';

import { useState, useMemo } from 'react';
import routesRaw from '@/data/routes.json';
import { getAllCities } from '@/lib/pathfinder';
import { haversineKm, cityCoords } from '@/lib/coords';
import { cityToIata } from '@/lib/frontier';

const allCitiesAlpha = getAllCities(routesRaw as { from: string; to: string }[]);
export { allCitiesAlpha };

// Multi-select city input used for both From and To.
//
// From: pass suggestCoords={userCoords} → suggestions always visible, sorted by user location.
// To:   omit suggestCoords             → no suggestions until first city is picked,
//                                         then sorted by distance from that first pick.
export function CityInputMulti({
  id,
  label,
  values,
  onChange,
  userCoords,
  suggestCoords,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  userCoords: [number, number] | null;
  suggestCoords?: [number, number] | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const suggested = useMemo(() => {
    const ref: [number, number] | null =
      suggestCoords !== undefined
        ? suggestCoords
        : values.length > 0 && cityCoords[values[0]] ? cityCoords[values[0]] : null;
    if (!ref) return [];
    return allCitiesAlpha
      .filter((c) => !values.includes(c) && cityCoords[c])
      .map((c) => ({
        city: c,
        iata: cityToIata[c],
        distMi: Math.round(haversineKm(ref[0], ref[1], cityCoords[c][0], cityCoords[c][1]) * 0.621371),
      }))
      .sort((a, b) => a.distMi - b.distMi)
      .slice(0, 5);
  }, [values, suggestCoords]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allCitiesAlpha
      .filter((c) => !values.includes(c))
      .map((c) => ({ city: c, iata: cityToIata[c] }))
      .filter((o) => !q || o.city.toLowerCase().includes(q) || (o.iata && o.iata.toLowerCase().startsWith(q)));
  }, [query, values]);

  function select(city: string) { onChange([...values, city]); setQuery(''); }
  function remove(city: string) { onChange(values.filter((c) => c !== city)); }

  const showSuggested = !query && suggested.length > 0;

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground mb-1">{label}</label>
      <div
        className="min-h-[46px] w-full border border-noir-border rounded-lg px-3 py-2 bg-noir-raised focus-within:ring-2 focus-within:ring-[#00853e] flex flex-wrap gap-1.5 items-center cursor-text"
        onClick={() => setOpen(true)}
      >
        {values.map((city) => (
          <span key={city} className="flex items-center gap-1 bg-noir-surface text-[#00853e] border border-[#00853e]/40 text-xs font-semibold rounded-md px-2 py-1 shrink-0">
            <span className="font-mono">{cityToIata[city] ?? city}</span>
            <button
              type="button"
              className="text-[#00853e]/60 hover:text-[#00853e] leading-none ml-0.5"
              onMouseDown={(e) => { e.stopPropagation(); remove(city); }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={query}
          autoComplete="off"
          placeholder={values.length === 0 ? 'City or airport code…' : 'Add more…'}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent py-0.5"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && (showSuggested || filtered.length > 0) && (
        <ul className="absolute z-20 w-full bg-noir-surface border border-noir-border rounded-lg shadow-2xl shadow-black/60 mt-1 max-h-72 overflow-auto">
          {showSuggested && (
            <>
              <li className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-noir-raised">
                Suggested
              </li>
              {suggested.map((opt) => (
                <li
                  key={opt.city}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-[#00853e]/10 hover:text-[#00853e] flex items-center justify-between gap-2"
                  onMouseDown={() => select(opt.city)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.iata && (
                      <span className="text-xs font-mono font-bold text-[#00853e] bg-[#00853e]/10 border border-[#00853e]/30 px-1.5 py-0.5 rounded shrink-0">
                        {opt.iata}
                      </span>
                    )}
                    <span className="truncate text-foreground">{opt.city}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{opt.distMi.toLocaleString()} mi</span>
                </li>
              ))}
              {filtered.length > 0 && (
                <li className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-noir-raised border-t border-noir-border">
                  All airports
                </li>
              )}
            </>
          )}
          {filtered.map((opt) => (
            <li
              key={opt.city}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-[#00853e]/10 hover:text-[#00853e] flex items-center gap-2"
              onMouseDown={() => select(opt.city)}
            >
              {opt.iata && (
                <span className="text-xs font-mono font-bold text-[#00853e] bg-[#00853e]/10 border border-[#00853e]/30 px-1.5 py-0.5 rounded shrink-0">
                  {opt.iata}
                </span>
              )}
              <span className="truncate text-foreground">{opt.city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
