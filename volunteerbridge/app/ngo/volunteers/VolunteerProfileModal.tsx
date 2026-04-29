"use client";

import { X, MapPin, Phone, Mail, Award, Clock, ShieldCheck, Zap } from "lucide-react";

interface VolunteerProfileModalProps {
  volunteer: any;
  onClose: () => void;
}

export default function VolunteerProfileModal({ volunteer, onClose }: VolunteerProfileModalProps) {
  if (!volunteer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-modern border-2 border-outline shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header/Cover */}
        <div className="relative h-32 bg-primary/10">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full text-secondary/60 hover:text-on-surface transition-all z-10"
          >
            <X size={20} />
          </button>
          
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-primary font-black text-4xl">
              {volunteer.name.charAt(0)}
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-black text-on-surface">{volunteer.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${volunteer.availability ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-xs font-black uppercase tracking-widest text-secondary/40">
                  {volunteer.availability ? "Available" : "Currently on a task"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-primary text-white font-black text-xs rounded-button hover:bg-primary/90 transition-all uppercase tracking-widest shadow-md">
                Assign Task
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <section>
                <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-primary" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {volunteer.skills?.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-black rounded-full border border-outline/40 uppercase tracking-tighter">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  Location
                </h3>
                <p className="text-sm font-bold text-on-surface">
                  {volunteer?.location?.address ?? "Registered Area"}
                </p>
                <p className="text-xs font-medium text-secondary/40 mt-1">
                  Ready for deployment within {volunteer.serviceRadius || 15}km radius
                </p>
              </section>

              <section>
                <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-primary" />
                  Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-variant/20 p-3 rounded-xl border border-outline/30">
                    <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Tasks Completed</p>
                    <p className="text-lg font-black text-on-surface">24</p>
                  </div>
                  <div className="bg-surface-variant/20 p-3 rounded-xl border border-outline/30">
                    <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Hours</p>
                    <p className="text-lg font-black text-on-surface">148</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-surface-variant/10 p-6 rounded-modern border-2 border-outline/30">
                <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-4">Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm border border-outline/40">
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Phone</p>
                      <p className="text-sm font-bold text-on-surface">{volunteer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm border border-outline/40">
                      <Mail size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Email</p>
                      <p className="text-sm font-bold text-on-surface">{volunteer.email || "volunteer@example.com"}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-6 rounded-modern border-2 border-dashed border-outline/60">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-2">
                    <Award size={14} className="text-primary" />
                    Achievements
                  </h3>
                  <span className="text-[10px] font-black text-primary uppercase">View All</span>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600 shadow-inner" title="First Responder">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shadow-inner" title="Quick Response">
                    <Zap size={20} />
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 shadow-inner" title="Reliable Partner">
                    <Clock size={20} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
