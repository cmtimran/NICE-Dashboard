"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, LogIn, LogOut, BedDouble, AlertCircle, XCircle,
  DollarSign, CreditCard, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  inhouse: number;
  expectedArrival: number;
  expectedDeparture: number;
  vacant: number;
  outOfOrder: number;
  outOfService: number;
}

interface RevenueStats {
  dailyCollection: number;
  todayRevenue: number;
  mtdRevenue: number;
}

// Custom Tick Component for Multiline X-Axis
const CustomAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#9ca3af" fontSize={12}>
        {payload.value.split('\n')[0]}
      </text>
      <text x={0} y={0} dy={32} textAnchor="middle" fill="#6b7280" fontSize={10}>
        {payload.value.split('\n')[1]}
      </text>
    </g>
  );
};

// ... inside Dashboard component ...

// Prepare data with combined key for easy access, though we pass custom tick
// Actually, we can just pass 'day' and 'shortDate' in the data and use one as unique key
// Let's modify the map slightly to pass a combined string to valid 'dataKey' or handle in custom tick.
// Easier: join them with newline in data, and split in tick.

// ... inside useEffect map ...
// day: ..., shortDate: ..., combined: day + '\n' + shortDate

// Let's fix the Interface first.
interface ForecastData {
  combinedDate: string; // "Mon\nDec 16"
  occupancyRate: number;
}



export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, forecastRes, trendRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/revenue'),
          fetch('/api/forecast?startDate=' + new Date().toISOString().split('T')[0] + '&endDate=' + new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]),
          fetch('/api/dashboard/revenue-trend?days=7')
        ]);

        const statsData = await statsRes.json();
        const revenueData = await revenueRes.json();
        const forecastRaw = await forecastRes.json();
        const trendData = await trendRes.json();

        if (statsData.error) throw new Error(statsData.details);

        setStats(statsData);
        setRevenue(revenueData);

        if (Array.isArray(forecastRaw)) {
          setForecast(forecastRaw.map((f: { date: string; occupancyPercent: number }) => ({
            combinedDate: `${new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' })}\n${new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            occupancyRate: f.occupancyPercent
          })));
        } else if (forecastRaw.forecast) {
          setForecast(forecastRaw.forecast.map((f: { date: string; occupancyPercent: number }) => ({
            combinedDate: `${new Date(f.date).toLocaleDateString('en-US', { weekday: 'short' })}\n${new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            occupancyRate: f.occupancyPercent
          })));
        }

        if (trendData.data) {
          setRevenueTrend(trendData.data.map((d: { fullDate: string;[key: string]: any }) => ({
            ...d,
            combinedDate: `${new Date(d.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}\n${new Date(d.fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          })));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 animate-pulse">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Real-time hotel statistics and performance</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-right hidden md:block">
            <div className="text-2xl font-bold text-white font-mono">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-wide">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

        {/* Revenue Cards (New) */}
        <motion.div variants={item} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md border border-green-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-green-500/40 transition-all">
          <div className="absolute right-[-20px] top-[-20px] bg-green-500/20 w-24 h-24 rounded-full blur-2xl group-hover:bg-green-500/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
              <DollarSign size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Today's Revenue</h3>
          <p className="text-3xl font-bold text-white mt-1">
            ৳ {revenue?.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>

        <motion.div variants={item} className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-md border border-blue-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="absolute right-[-20px] top-[-20px] bg-blue-500/20 w-24 h-24 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <TrendingUp size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">MTD Revenue</h3>
          <p className="text-3xl font-bold text-white mt-1">
            ৳ {revenue?.mtdRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>

        <motion.div variants={item} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-purple-500/20 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="absolute right-[-20px] top-[-20px] bg-purple-500/20 w-24 h-24 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
              <CreditCard size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Daily Collection</h3>
          <p className="text-3xl font-bold text-white mt-1">
            ৳ {revenue?.dailyCollection.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>

        {/* Standard Stats */}
        <motion.div variants={item} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Inhouse Guests</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats?.inhouse} Rooms</p>
        </motion.div>

        <motion.div variants={item} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <LogIn size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Expected Arrival</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats?.expectedArrival} Rooms</p>
        </motion.div>

        <motion.div variants={item} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
              <LogOut size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Exp. Departure</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats?.expectedDeparture} Rooms</p>
        </motion.div>

        <motion.div variants={item} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl relative overflow-hidden hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <BedDouble size={24} />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm font-medium">Vacant Clean</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats?.vacant} Rooms</p>
        </motion.div>

      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Occupancy Chart */}
        <motion.div variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Occupancy Trend (Forecast 10 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="combinedDate"
                  stroke="#9ca3af"
                  tick={<CustomAxisTick />}
                  height={50}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(value: number) => [`${value}%`, 'Occupancy']}
                />
                <Area
                  type="monotone"
                  dataKey="occupancyRate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOcc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ADR Chart (Average Daily Rate) */}
        <motion.div variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">ADR Trend (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorAdr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="combinedDate"
                  stroke="#9ca3af"
                  tick={<CustomAxisTick />}
                  height={50}
                  interval={0}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: number) => [`৳ ${value.toLocaleString()}`, 'ADR']}
                />
                <Area
                  type="monotone"
                  dataKey="adr"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAdr)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Revenue Trend Chart (Stacked) */}
      <motion.div variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Revenue Breakdown (Last 7 Days)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFnb" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOther" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="combinedDate"
                stroke="#9ca3af"
                tick={<CustomAxisTick />}
                height={50}
                interval={0}
              />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                formatter={(value: number, name: string) => [`৳ ${value.toLocaleString()}`, name]}
              />
              <Area type="monotone" dataKey="roomRevenue" stackId="1" stroke="#10b981" fill="url(#colorRoom)" name="Room" />
              <Area type="monotone" dataKey="fnbRevenue" stackId="1" stroke="#3b82f6" fill="url(#colorFnb)" name="F&B" />
              <Area type="monotone" dataKey="otherRevenue" stackId="1" stroke="#8b5cf6" fill="url(#colorOther)" name="Other" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quick Status / Recent Activity Placeholder (Kept for layout, maybe move to side if needed) */}
      <motion.div variants={item} className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Quick Status</h3>
        <div className="grid grid-cols-2 gap-4"> {/* Changed to grid for better compact layout */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                <AlertCircle size={20} />
              </div>
              <span className="text-gray-300 text-sm">Out of Order</span>
            </div>
            <span className="font-bold text-white">{stats?.outOfOrder}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="bg-pink-500/20 p-2 rounded-lg text-pink-400">
                <XCircle size={20} />
              </div>
              <span className="text-gray-300 text-sm">Out of Service</span>
            </div>
            <span className="font-bold text-white">{stats?.outOfService}</span>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
