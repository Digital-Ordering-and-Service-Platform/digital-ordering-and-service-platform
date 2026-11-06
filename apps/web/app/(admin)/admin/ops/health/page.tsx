"use client";

import { useEffect, useState } from "react";

interface ProviderHealth {
  name: string;
  status: string;
  webhook_queue_depth: number;
  is_degraded: boolean;
  last_event_time: string;
}

interface SystemHealth {
  status: string;
  uptime_seconds: number;
  redis_memory_used: string;
  active_tenant_connections: number;
  provider_rails: ProviderHealth[];
}

export default function PlatformHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    // Mock health fetch for initial dashboard display
    setHealth({
      status: "ok",
      uptime_seconds: 3600,
      redis_memory_used: "14.2MB",
      active_tenant_connections: 12,
      provider_rails: [
        { name: "Telebirr (ቴሌብር)", status: "healthy", webhook_queue_depth: 0, is_degraded: false, last_event_time: "Just now" },
        { name: "Chapa Gateway (ቻፓ)", status: "healthy", webhook_queue_depth: 1, is_degraded: false, last_event_time: "1 min ago" },
        { name: "CBE Direct (ንግድ ባንክ)", status: "healthy", webhook_queue_depth: 0, is_degraded: false, last_event_time: "5 mins ago" },
      ],
    });
  }, []);

  if (!health) return <div className="p-6 text-buna">Loading platform health data...</div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center border-b border-buna/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Cross-Tenant Platform Health</h1>
          <p className="text-sm text-buna-mocha">Real-time system availability, WebSockets, and payment webhook queues.</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${health.status === 'ok' ? 'bg-yetsom-container text-white' : 'bg-gold text-buna'}`}>
          System Status: {health.status}
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-buna/10">
          <span className="text-xs text-buna-mocha uppercase font-semibold">Active Tenant Connections</span>
          <p className="text-2xl font-bold text-primary mt-1">{health.active_tenant_connections}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-buna/10">
          <span className="text-xs text-buna-mocha uppercase font-semibold">Redis Memory Usage</span>
          <p className="text-2xl font-bold text-buna mt-1">{health.redis_memory_used}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-buna/10">
          <span className="text-xs text-buna-mocha uppercase font-semibold">System Uptime</span>
          <p className="text-2xl font-bold text-buna mt-1">{Math.floor(health.uptime_seconds / 60)} mins</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-buna">Payment Provider Rail Health & Webhook Queues</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {health.provider_rails.map((rail) => (
            <div key={rail.name} className={`p-4 rounded-lg border ${rail.is_degraded ? 'bg-red-50 border-red-300' : 'bg-white border-buna/10'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-buna">{rail.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${rail.is_degraded ? 'bg-red-600 text-white' : 'bg-green-100 text-green-800'}`}>
                  {rail.status}
                </span>
              </div>
              <div className="mt-3 text-xs space-y-1 text-buna-mocha">
                <p>Webhook Queue Depth: <strong className="text-buna">{rail.webhook_queue_depth}</strong></p>
                <p>Last Webhook Event: {rail.last_event_time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
