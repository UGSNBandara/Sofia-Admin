import { useEffect, useState } from 'react';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LineChart, Line } from 'recharts';
import { api } from '../lib/api';

const accent = '#5dd3ff';
const accent2 = '#7A9BFF';
const muted = '#64748b';
const series = ['#5dd3ff', '#7A9BFF', '#77E4B0', '#FFB86B'];

// Time-series sales per category (dummy); replace later with API data
const timeSeries = [
  { date: '2025-11-25', Cone: 10, Cup: 8, Sundae: 6, Stick: 4 },
  { date: '2025-11-26', Cone: 12, Cup: 9, Sundae: 7, Stick: 5 },
  { date: '2025-11-27', Cone: 9,  Cup: 7, Sundae: 8, Stick: 6 },
  { date: '2025-11-28', Cone: 15, Cup: 11, Sundae: 9, Stick: 7 },
  { date: '2025-11-29', Cone: 14, Cup: 10, Sundae: 10, Stick: 6 },
  { date: '2025-11-30', Cone: 18, Cup: 12, Sundae: 11, Stick: 8 },
  { date: '2025-12-01', Cone: 20, Cup: 15, Sundae: 12, Stick: 9 },
];

type FacialLog = {
  session_id: string;
  timestamp: string;
  emotion: string;
  confidence: number;
};

type WeatherLog = {
  timestamp: string;
  temperature_bucket: string;
  time_of_day: string;
};

type SegmentTop = {
  key: string;
  categories: string[];
};

function normaliseFacialLog(raw: any): FacialLog | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [session_id, timestamp, emotion, confidence] = raw;
    return {
      session_id: String(session_id ?? ''),
      timestamp: String(timestamp ?? ''),
      emotion: String(emotion ?? ''),
      confidence: Number(confidence ?? 0),
    };
  }
  if (typeof raw === 'object') {
    return {
      session_id: String((raw as any).session_id ?? ''),
      timestamp: String((raw as any).timestamp ?? ''),
      emotion: String((raw as any).emotion ?? ''),
      confidence: Number((raw as any).confidence ?? 0),
    };
  }
  return null;
}

function normaliseWeatherLog(raw: any): WeatherLog | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [timestamp, temperature_bucket, time_of_day] = raw;
    return {
      timestamp: String(timestamp ?? ''),
      temperature_bucket: String(temperature_bucket ?? ''),
      time_of_day: String(time_of_day ?? ''),
    };
  }
  if (typeof raw === 'object') {
    return {
      timestamp: String((raw as any).timestamp ?? ''),
      temperature_bucket: String((raw as any).temperature_bucket ?? ''),
      time_of_day: String((raw as any).time_of_day ?? ''),
    };
  }
  return null;
}

function formatSegmentLabel(key: string): string {
  if (!key) return '';
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function Dashboard() {
  const [globalTopCategories, setGlobalTopCategories] = useState<string[]>([]);
  const [segmentTopCategories, setSegmentTopCategories] = useState<SegmentTop[]>([]);
  const [facialLogs, setFacialLogs] = useState<FacialLog[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const [catsRes, facialRes, weatherRes] = await Promise.all([
          api('/analytics/top-categories?k=3'),
          api('/analytics/facial-logs?limit=20'),
          api('/analytics/weather-logs?limit=20'),
        ]);
        if (cancelled) return;

        const cats = catsRes as any;
        const global = Array.isArray(cats.global_top_categories)
          ? (cats.global_top_categories as unknown[]).map(name => String(name))
          : Array.isArray(cats.top_categories)
            ? (cats.top_categories as unknown[]).map(name => String(name))
            : [];
        setGlobalTopCategories(global);

        const segments: SegmentTop[] = [];
        if (cats.segments && typeof cats.segments === 'object') {
          for (const [key, value] of Object.entries(cats.segments as Record<string, unknown>)) {
            if (Array.isArray(value) && value.length) {
              segments.push({
                key,
                categories: (value as unknown[]).map(v => String(v)),
              });
            }
          }
        }
        setSegmentTopCategories(segments);

        const facialRaw = Array.isArray((facialRes as any).facial_logs)
          ? (facialRes as any).facial_logs
          : [];
        setFacialLogs(
          (facialRaw as unknown[])
            .map(entry => normaliseFacialLog(entry))
            .filter((entry): entry is FacialLog => Boolean(entry))
        );

        const weatherRaw = Array.isArray((weatherRes as any).weather_logs)
          ? (weatherRes as any).weather_logs
          : [];
        setWeatherLogs(
          (weatherRaw as unknown[])
            .map(entry => normaliseWeatherLog(entry))
            .filter((entry): entry is WeatherLog => Boolean(entry))
        );
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Insight Board</p>
          <h2>Sales Pulse</h2>
          <p className="muted">Blend of historical signals plus next-week forecast.</p>
        </div>
        <div className="page-actions">
          {loading && <span className="muted tiny">Syncing analytics…</span>}
          {error && <span className="muted tiny">Error: {error}</span>}
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Live trend</p>
              <h3>Time-Series Sales by Category</h3>
            </div>
          </div>
          <div className="chart-shell">
            <ResponsiveContainer>
              <LineChart data={timeSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#25304b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                <YAxis tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                <Tooltip contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }} />
                <Legend wrapperStyle={{ color: '#e9f0ff', fontSize: 14 }} iconType="circle" />
                <Line type="monotone" dataKey="Cone" stroke={series[0]} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Cup" stroke={series[1]} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Sundae" stroke={series[2]} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="Stick" stroke={series[3]} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">AI forecast</p>
              <h3>Next 7 Days</h3>
            </div>
          </div>
          <div className="chart-shell">
            <ResponsiveContainer>
              <LineChart data={[
                { date: '2025-12-02', Cone: 21, Cup: 16, Sundae: 13, Stick: 9 },
                { date: '2025-12-03', Cone: 22, Cup: 17, Sundae: 13, Stick: 9 },
                { date: '2025-12-04', Cone: 23, Cup: 17, Sundae: 14, Stick: 10 },
                { date: '2025-12-05', Cone: 24, Cup: 18, Sundae: 14, Stick: 10 },
                { date: '2025-12-06', Cone: 25, Cup: 19, Sundae: 15, Stick: 11 },
                { date: '2025-12-07', Cone: 26, Cup: 19, Sundae: 16, Stick: 11 },
                { date: '2025-12-08', Cone: 27, Cup: 20, Sundae: 16, Stick: 12 },
              ]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#25304b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                <YAxis tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                <Tooltip contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }} />
                <Legend wrapperStyle={{ color: '#e9f0ff', fontSize: 14 }} iconType="circle" />
                <Line type="monotone" dataKey="Cone" stroke={series[0]} strokeWidth={3} dot={false} strokeDasharray="6 4" />
                <Line type="monotone" dataKey="Cup" stroke={series[1]} strokeWidth={3} dot={false} strokeDasharray="6 4" />
                <Line type="monotone" dataKey="Sundae" stroke={series[2]} strokeWidth={3} dot={false} strokeDasharray="6 4" />
                <Line type="monotone" dataKey="Stick" stroke={series[3]} strokeWidth={3} dot={false} strokeDasharray="6 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Menu shape</p>
              <h3>Top Categories</h3>
            </div>
          </div>
          <div className="metric-shell">
            {globalTopCategories.length ? (
              <>
                <p className="muted tiny">Global</p>
                <ol className="metric-list">
                  {globalTopCategories.map((name, idx) => (
                    <li key={`${name}-${idx}`} className="metric-row">
                      <span className="metric-rank">{idx + 1}</span>
                      <span className="metric-label">{name}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="muted tiny">No category signal yet.</p>
            )}

            {segmentTopCategories.length > 0 && (
              <div className="segment-shell">
                {segmentTopCategories.map(segment => (
                  <div key={segment.key} className="segment-row">
                    <div className="segment-header">
                      <span className="segment-key">{formatSegmentLabel(segment.key)}</span>
                    </div>
                    <div className="segment-tags">
                      {segment.categories.map(category => (
                        <span key={`${segment.key}-${category}`} className="pill subtle">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card glass chart-card logs-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Mood stream</p>
              <h3>Facial Logs</h3>
            </div>
          </div>
          <div className="log-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Session</th>
                  <th>Emotion</th>
                  <th>Conf.</th>
                </tr>
              </thead>
              <tbody>
                {facialLogs.map(log => (
                  <tr key={`${log.session_id}-${log.timestamp}`}>
                    <td className="tiny muted">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="mono tiny muted">{log.session_id}</td>
                    <td><span className="pill subtle">{log.emotion}</span></td>
                    <td>{(log.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!facialLogs.length && (
              <p className="muted tiny">No facial analysis logged yet.</p>
            )}
          </div>
        </div>

        <div className="card glass chart-card logs-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Context cues</p>
              <h3>Weather Logs</h3>
            </div>
          </div>
          <div className="log-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Temperature</th>
                  <th>Time of day</th>
                </tr>
              </thead>
              <tbody>
                {weatherLogs.map(log => (
                  <tr key={log.timestamp}>
                    <td className="tiny muted">{new Date(log.timestamp).toLocaleString()}</td>
                    <td><span className="pill subtle">{log.temperature_bucket}</span></td>
                    <td>{log.time_of_day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!weatherLogs.length && (
              <p className="muted tiny">No weather samples captured yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
