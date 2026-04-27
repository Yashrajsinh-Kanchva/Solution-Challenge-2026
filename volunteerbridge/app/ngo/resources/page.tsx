"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  Package, Plus, AlertTriangle, 
  Utensils, Activity, Home, 
  ArrowUpRight, RefreshCw, TrendingUp
} from "lucide-react";

const THRESHOLDS = {
  food: 100,
  medicine: 100,
  shelter: 50
};

export default function NgoResources() {
  const [resources, setResources] = useState<any>({ food: 0, medicine: 0, shelter: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, number>>({ food: 0, medicine: 0, shelter: 0 });
  
  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  useEffect(() => {
    fetchResources();
  }, [ngoId]);

  const fetchResources = async () => {
    setLoading(true);
    const data = await apiClient.getNgoStats(ngoId);
    if (data?.resources) {
      setResources(data.resources);
    }
    setLoading(false);
  };

  const handleUpdate = async (type: string) => {
    const amountToAdd = amounts[type];
    if (amountToAdd <= 0) return;

    setUpdating(type);
    try {
      const newResources = { ...resources, [type]: resources[type] + amountToAdd };
      await apiClient.updateNgoResources(ngoId, newResources);
      setResources(newResources);
      setAmounts(prev => ({ ...prev, [type]: 0 }));
    } catch (error) {
      console.error("Failed to update resource:", error);
    } finally {
      setUpdating(null);
    }
  };

  const isLow = (type: string, count: number) => {
    return count < (THRESHOLDS as any)[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-black text-secondary/40 uppercase tracking-widest">Inventory Check...</p>
        </div>
      </div>
    );
  }

  const resourceTypes = [
    { id: "food", label: "Food Supplies", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "medicine", label: "Medical Kits", icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "shelter", label: "Shelter Capacity", icon: Home, color: "text-purple-500", bg: "bg-purple-50" }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Resources</h1>
          <p className="text-secondary/60 font-medium mt-1">Manage your emergency supplies.</p>
        </div>
        <button 
          onClick={fetchResources}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-outline/60 rounded-full text-xs font-black text-secondary hover:border-primary transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {resourceTypes.map((res) => {
          const count = resources[res.id] || 0;
          const low = isLow(res.id, count);
          
          return (
            <div key={res.id} className={`bg-white rounded-modern border-2 transition-all duration-300 p-10 custom-shadow flex flex-col justify-between relative overflow-hidden group ${
              low ? "border-red-500 ring-8 ring-red-50" : "border-outline/60 hover:border-primary/40"
            }`}>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-5 rounded-2xl shadow-lg transition-transform group-hover:scale-110 duration-300 ${res.bg} ${res.color}`}>
                    <res.icon size={32} />
                  </div>
                  {low && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce shadow-lg shadow-red-500/20">
                      <AlertTriangle size={14} />
                      Low Stock
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-black text-on-surface mb-2 group-hover:text-primary transition-colors">{res.label}</h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-on-surface tracking-tighter">{count}</span>
                  <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">Units in Stock</span>
                </div>
              </div>

              <div className="mt-10 pt-10 border-t-2 border-outline/30 space-y-5 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={amounts[res.id]}
                      onChange={(e) => setAmounts(prev => ({ ...prev, [res.id]: parseInt(e.target.value) || 0 }))}
                      className="w-full px-5 py-4 bg-surface-variant/30 border-2 border-outline/40 rounded-2xl text-sm font-black text-on-surface focus:border-primary focus:bg-white outline-none transition-all shadow-inner"
                      placeholder="Add Qty"
                    />
                  </div>
                  <button 
                    disabled={updating === res.id}
                    onClick={() => handleUpdate(res.id)}
                    className="px-8 py-4 bg-on-surface text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-lg shadow-on-surface/10"
                  >
                    {updating === res.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus size={16} strokeWidth={3} />
                        Add Stock
                      </>
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-primary" />
                    Average Need: +{Math.floor((THRESHOLDS as any)[res.id] * 0.8)} units
                  </p>
                  <div className="flex -space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-surface-variant shadow-sm" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative Background */}
              <div className={`absolute -right-10 -bottom-10 w-40 h-40 ${res.bg} opacity-[0.2] rounded-full blur-3xl group-hover:opacity-[0.4] transition-opacity`} />
            </div>
          );
        })}
      </div>

      {/* Global Inventory Status */}
      <div className="bg-on-surface rounded-modern p-10 text-white custom-shadow overflow-hidden relative">
        <div className="relative z-10 grid grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-4">Summary</h2>
            <p className="text-white/60 font-medium leading-relaxed max-w-md">
              Keep stock levels high to be ready for emergencies. Low stocks are automatically flagged.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {(() => {
              const foodScore = Math.min(100, (resources.food / THRESHOLDS.food) * 100);
              const medicineScore = Math.min(100, (resources.medicine / THRESHOLDS.medicine) * 100);
              const shelterScore = Math.min(100, (resources.shelter / THRESHOLDS.shelter) * 100);
              const healthIndex = Math.floor((foodScore + medicineScore + shelterScore) / 3);
              
              const lowCount = [
                resources.food < THRESHOLDS.food,
                resources.medicine < THRESHOLDS.medicine,
                resources.shelter < THRESHOLDS.shelter
              ].filter(Boolean).length;

              let priority = "Low";
              let priorityColor = "bg-green-400";
              let priorityWidth = "30%";
              
              if (lowCount >= 2 || healthIndex < 50) {
                priority = "Critical";
                priorityColor = "bg-red-500";
                priorityWidth = "95%";
              } else if (lowCount === 1 || healthIndex < 80) {
                priority = "Medium";
                priorityColor = "bg-orange-400";
                priorityWidth = "60%";
              }

              return (
                <>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-2">Overall Stock</p>
                    <p className="text-3xl font-black">{healthIndex}%</p>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${healthIndex < 50 ? "bg-red-500" : healthIndex < 80 ? "bg-orange-400" : "bg-green-400"}`} 
                        style={{ width: `${healthIndex}%` }} 
                      />
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-2">Restock Need</p>
                    <p className="text-3xl font-black">{priority}</p>
                    <div className="w-full h-1 bg-white/20 rounded-full mt-3">
                      <div className={`h-full ${priorityColor} rounded-full transition-all duration-1000`} style={{ width: priorityWidth }} />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-20 opacity-10">
          <Package size={120} />
        </div>
      </div>
    </div>
  );
}
