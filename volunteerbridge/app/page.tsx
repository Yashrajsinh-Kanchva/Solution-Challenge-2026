import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#F7F5EE] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4DCA8]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#4D5A2C]/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-2xl w-full text-center">
        <div className="bg-white border-[1.5px] border-[#D4DCA8] rounded-[32px] p-8 sm:p-16 shadow-[0_20px_50px_rgba(77,90,44,0.1)]">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EEF3D2] border border-[#D4DCA8] text-[#4D5A2C] text-sm font-bold mb-8 animate-in">
            <ShieldCheck size={16} />
            <span>Smart Resource Allocation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#1A1C15] mb-6 tracking-tight leading-[1.1] animate-in" style={{ animationDelay: '0.1s' }}>
            Volunteer<span className="text-[#4D5A2C]">Bridge</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-[#404535] leading-relaxed mb-12 max-w-lg mx-auto animate-in" style={{ animationDelay: '0.2s' }}>
            A unified platform connecting NGOs, citizens, and volunteers for faster, 
            smarter community support and disaster response.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in" style={{ animationDelay: '0.3s' }}>
            <Link 
              href="/login" 
              prefetch={false}
              className="w-full sm:w-auto bg-[#4D5A2C] text-white px-10 py-4 rounded-2xl font-bold hover:bg-[#647A39] transition-all shadow-[0_8px_25px_rgba(77,90,44,0.3)] hover:shadow-[0_12px_35px_rgba(77,90,44,0.4)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={20} />
            </Link>
            
            <Link 
              href="/admin/dashboard" 
              prefetch={false}
              className="w-full sm:w-auto border-[1.5px] border-[#D4DCA8] text-[#4D5A2C] px-10 py-4 rounded-2xl font-bold hover:bg-[#F7F5EE] transition-all active:scale-95 flex items-center justify-center"
            >
              Admin Portal
            </Link>
          </div>
        </div>
        
        <p className="mt-8 text-sm font-medium text-[#6B7160] opacity-60">
          Powered by Claude AI & Real-time Matching
        </p>
      </div>
    </main>
  );
}

