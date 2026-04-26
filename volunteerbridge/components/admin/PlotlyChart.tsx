"use client";
// Dynamic Plotly wrapper to avoid SSR issues
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full text-secondary/40 text-sm font-semibold">Loading chart...</div>
)}) as any;
export default Plot;
