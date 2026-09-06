"use client";

import { useCallback, useEffect, useState } from "react";

type HitlStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface HitlRequest {
  id: string;
  capabilityName: string;
  params: any;
  status: HitlStatus;
  createdAt: number;
}

export default function HitlDashboard() {
  const [requests, setRequests] = useState<HitlRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hitl/pending");
      if (res.ok) {
        setRequests(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  const approve = async (id: string) => {
    await fetch("/api/hitl/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadRequests();
  };

  const reject = async (id: string) => {
    await fetch("/api/hitl/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadRequests();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">HITL Dashboard (Human-in-the-Loop)</h1>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 text-center">
              <p className="text-stone-500">No pending requests.</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-rose-600">
                      Action: {req.capabilityName}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      ID: {req.id}
                    </p>
                    <p className="text-xs text-stone-400">
                      Requested at: {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-x-3">
                    <button
                      onClick={() => approve(req.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(req.id)}
                      className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 font-medium text-sm transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-stone-600 mb-2">Parameters:</h4>
                  <div className="bg-stone-100 p-4 rounded text-sm font-mono overflow-x-auto">
                    <pre>{JSON.stringify(req.params, null, 2)}</pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
