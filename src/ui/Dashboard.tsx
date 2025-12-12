import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../lib/api';

const lineColor = '#5dd3ff';
const accent2 = '#7A9BFF';
const palette = ['#5dd3ff', '#7A9BFF', '#77E4B0', '#FFB86B', '#FF7B7B', '#A78BFA'];

type DashboardStatsResponse = {
  age_distribution?: Record<string, number>;
  gender_distribution?: Record<string, number>;
  emotion_frequency?: Record<string, number>;
  daily_sessions?: { day: string; count: number }[];
  emotion_by_weather?: Record<string, Record<string, number>>;
};

type FacialLog = {
  session_id: string;
  age_group?: string | null;
  gender?: string | null;
  weather_temp?: string | null;
  weather_tod?: string | null;
  dominant_emotion?: string | null;
  updated_at: string;
};

type WeatherLog = {
  timestamp: string;
  temperature_bucket: string;
  time_of_day: string;
};

function normaliseFacialLog(raw: any): FacialLog | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const [session_id, age_group, gender, weather_temp, weather_tod, dominant_emotion, _emotion_counts, updated_at] =
      raw;
    return {
      session_id: String(session_id ?? ''),
      age_group: age_group ?? null,
      gender: gender ?? null,
      weather_temp: weather_temp ?? null,
      weather_tod: weather_tod ?? null,
      dominant_emotion: dominant_emotion ?? null,
      updated_at: String(updated_at ?? ''),
    };
  }
  if (typeof raw === 'object') {
    const r = raw as any;
    return {
      session_id: String(r.session_id ?? ''),
      age_group: r.age_group ?? null,
      gender: r.gender ?? null,
      weather_temp: r.weather_temp ?? null,
      weather_tod: r.weather_tod ?? null,
      dominant_emotion: r.dominant_emotion ?? null,
      updated_at: String(r.updated_at ?? ''),
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
    const r = raw as any;
    return {
      timestamp: String(r.timestamp ?? ''),
      temperature_bucket: String(r.temperature_bucket ?? ''),
      time_of_day: String(r.time_of_day ?? ''),
    };
  }
  return null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [facialLogs, setFacialLogs] = useState<FacialLog[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<WeatherLog[]>([]);
  const [ageFilter, setAgeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard stats + weather logs
  useEffect(() => {
    let cancelled = false;
    async function loadStatsAndWeather() {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, weatherRes] = await Promise.all([
          api('/analytics/dashboard-stats?days=7'),
          api('/analytics/weather-logs?limit=20'),
        ]);
        if (cancelled) return;

        setStats(statsRes as DashboardStatsResponse);

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
    loadStatsAndWeather();
    return () => {
      cancelled = true;
    };
  }, []);

  // Facial logs with filters
  useEffect(() => {
    let cancelled = false;
    async function loadFacialLogs() {
      try {
        const params = new URLSearchParams();
        params.set('limit', '20');
        if (ageFilter) params.set('age_group', ageFilter);
        if (genderFilter) params.set('gender', genderFilter);
        if (emotionFilter) params.set('dominant_emotion', emotionFilter);
        const res = await api(`/analytics/facial-logs?${params.toString()}`);
        if (cancelled) return;
        const facialRaw = Array.isArray((res as any).facial_logs) ? (res as any).facial_logs : [];
        setFacialLogs(
          (facialRaw as unknown[])
            .map(entry => normaliseFacialLog(entry))
            .filter((entry): entry is FacialLog => Boolean(entry))
        );
      } catch {
        if (!cancelled) setFacialLogs([]);
      }
    }
    loadFacialLogs();
    return () => {
      cancelled = true;
    };
  }, [ageFilter, genderFilter, emotionFilter]);

  const ageData =
    stats?.age_distribution
      ? Object.entries(stats.age_distribution).map(([name, value]) => ({ name, value }))
      : [];

  const genderData =
    stats?.gender_distribution
      ? Object.entries(stats.gender_distribution).map(([name, value]) => ({ name, value }))
      : [];

  const emotionFrequencyData =
    stats?.emotion_frequency
      ? Object.entries(stats.emotion_frequency).map(([emotion, count]) => ({ emotion, count }))
      : [];

  const dailySessionsData =
    stats?.daily_sessions?.map(point => ({ day: point.day, count: point.count })) ?? [];

  const emotionWeatherRows: { weather: string; [emotion: string]: number | string }[] = [];
  const emotionWeatherKeysSet = new Set<string>();

  if (stats?.emotion_by_weather) {
    for (const [weather, emotions] of Object.entries(stats.emotion_by_weather)) {
      const row: { weather: string; [emotion: string]: number | string } = { weather };
      for (const [emotion, count] of Object.entries(emotions)) {
        row[emotion] = count;
        emotionWeatherKeysSet.add(emotion);
      }
      emotionWeatherRows.push(row);
    }
  }

  const emotionWeatherKeys = Array.from(emotionWeatherKeysSet);

  const ageOptions = stats?.age_distribution ? Object.keys(stats.age_distribution) : [];
  const genderOptions = stats?.gender_distribution ? Object.keys(stats.gender_distribution) : [];
  const emotionOptions = stats?.emotion_frequency ? Object.keys(stats.emotion_frequency) : [];

  const forecastSeries = [
    { day: '2025-12-02', count: 21 },
    { day: '2025-12-03', count: 22 },
    { day: '2025-12-04', count: 23 },
    { day: '2025-12-05', count: 24 },
    { day: '2025-12-06', count: 25 },
    { day: '2025-12-07', count: 26 },
    { day: '2025-12-08', count: 27 },
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Insight Board</p>
          <h2>Sales Pulse</h2>
          <p className="muted">Blend of demographics, emotion, and context.</p>
        </div>
        <div className="page-actions">
          {loading && <span className="muted tiny">Syncing analytics…</span>}
          {error && <span className="muted tiny">Error: {error}</span>}
        </div>
      </div>

      <div className="analytics-grid">
        {/* Trend: sessions per day */}
        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Trend</p>
              <h3>Sessions per Day</h3>
            </div>
          </div>
          <div className="chart-shell">
            {dailySessionsData.length ? (
              <ResponsiveContainer>
                <LineChart data={dailySessionsData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#25304b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                  <YAxis tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                  <Tooltip contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }} />
                  <Legend wrapperStyle={{ color: '#e9f0ff', fontSize: 14 }} />
                  <Line type="monotone" dataKey="count" stroke={lineColor} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted tiny">No session trend data yet.</p>
            )}
          </div>
        </div>

        {/* AI forecast (dummy) */}
        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">AI forecast</p>
              <h3>Next 7 Days (Dummy)</h3>
            </div>
          </div>
          <div className="chart-shell">
            <ResponsiveContainer>
              <LineChart data={forecastSeries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#25304b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                <YAxis tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                <Tooltip contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }} />
                <Legend wrapperStyle={{ color: '#e9f0ff', fontSize: 14 }} />
                <Line type="monotone" dataKey="count" stroke={accent2} strokeWidth={3} dot={false} strokeDasharray="6 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion frequency */}
        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Emotions</p>
              <h3>Dominant Emotion Frequency</h3>
            </div>
          </div>
          <div className="chart-shell">
            {emotionFrequencyData.length ? (
              <ResponsiveContainer>
                <BarChart data={emotionFrequencyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#25304b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="emotion" tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                  <YAxis tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                  <Tooltip contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }} />
                  <Legend wrapperStyle={{ color: '#e9f0ff', fontSize: 14 }} />
                  <Bar dataKey="count">
                    {emotionFrequencyData.map((_, index) => (
                      <Cell key={index} fill={palette[index % palette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted tiny">No emotion frequency data yet.</p>
            )}
          </div>
        </div>

        {/* Demographics pies */}
        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Demographics</p>
              <h3>Age & Gender</h3>
            </div>
          </div>
          <div className="demographics-grid">
            <div className="demographics-chart">
              <p className="muted tiny">Age groups</p>
              {ageData.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={ageData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {ageData.map((_, index) => (
                        <Cell key={index} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="muted tiny">No age data.</p>
              )}
            </div>
            <div className="demographics-chart">
              <p className="muted tiny">Gender</p>
              {genderData.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={genderData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {genderData.map((_, index) => (
                        <Cell key={index} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="muted tiny">No gender data.</p>
              )}
            </div>
          </div>
        </div>

        {/* Emotion vs weather */}
        <div className="card glass chart-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Correlation</p>
              <h3>Emotion vs Weather</h3>
            </div>
          </div>
          <div className="chart-shell">
            {emotionWeatherRows.length ? (
              <ResponsiveContainer>
                <BarChart data={emotionWeatherRows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#25304b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="weather" tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                  <YAxis tick={{ fill: '#e9f0ff', fontSize: 14 }} stroke="#9fb2d8" />
                  <Tooltip contentStyle={{ background: '#141a2f', border: '1px solid #223', color: '#e9f0ff' }} />
                  <Legend wrapperStyle={{ color: '#e9f0ff', fontSize: 14 }} />
                  {emotionWeatherKeys.map((key, idx) => (
                    <Bar key={key} dataKey={key} stackId="emotion" fill={palette[idx % palette.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="muted tiny">No emotion/weather data yet.</p>
            )}
          </div>
        </div>

        {/* Facial logs with filters */}
        <div className="card glass chart-card logs-card">
          <div className="spaced chart-head">
            <div>
              <p className="eyebrow">Mood stream</p>
              <h3>Facial Logs</h3>
            </div>
          </div>
          <div className="filters" style={{ marginBottom: 12 }}>
            <div>
              <label>Age group</label>
              <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}>
                <option value="">All</option>
                {ageOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Gender</label>
              <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                <option value="">All</option>
                {genderOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Emotion</label>
              <select value={emotionFilter} onChange={e => setEmotionFilter(e.target.value)}>
                <option value="">All</option>
                {emotionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="log-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Session</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Weather</th>
                  <th>Time</th>
                  <th>Emotion</th>
                </tr>
              </thead>
              <tbody>
                {facialLogs.map(log => (
                  <tr key={`${log.session_id}-${log.updated_at}`}>
                    <td className="tiny muted">{new Date(log.updated_at).toLocaleString()}</td>
                    <td className="mono tiny muted">{log.session_id}</td>
                    <td>{log.age_group ?? '–'}</td>
                    <td>{log.gender ?? '–'}</td>
                    <td>{log.weather_temp ?? '–'}</td>
                    <td>{log.weather_tod ?? '–'}</td>
                    <td><span className="pill subtle">{log.dominant_emotion ?? '–'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!facialLogs.length && (
              <p className="muted tiny">No facial analysis logged yet.</p>
            )}
          </div>
        </div>

        {/* Weather logs */}
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
