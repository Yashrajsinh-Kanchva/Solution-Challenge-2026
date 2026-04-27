"use client";

import { useState } from "react";
import { 
  FileText, Upload, CheckCircle, 
  AlertCircle, Loader2, Search, Filter 
} from "lucide-react";

export default function NgoSurveys() {
  const [uploading, setUploading] = useState(false);
  const [surveys, setSurveys] = useState([
    { id: 1, name: "Area-A-Field-Report.pdf", status: "parsed", date: "2024-03-20", records: 12 },
    { id: 2, name: "Survey-B-Community-Needs.jpg", status: "parsed", date: "2024-03-18", records: 8 },
  ]);

  const handleUpload = () => {
    setUploading(true);
    // Simulate AI parsing
    setTimeout(() => {
      setSurveys(prev => [
        { 
          id: Date.now(), 
          name: "New-Survey-Upload.pdf", 
          status: "parsed", 
          date: new Date().toISOString().split('T')[0], 
          records: Math.floor(Math.random() * 20) + 5 
        },
        ...prev
      ]);
      setUploading(false);
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Need Surveys</h1>
          <p className="text-secondary/60 font-medium mt-1">Upload and parse paper surveys using Claude AI</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-button hover:bg-primary/90 transition-all shadow-md">
            <Search size={18} /> Search Records
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Upload Zone */}
        <div className="col-span-4">
          <div className="bg-white p-8 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-6 sticky top-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <Upload size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-on-surface">Upload Field Reports</h3>
              <p className="text-sm text-secondary/60 mt-1">Drag and drop PDFs or images of paper surveys</p>
            </div>
            <input 
              type="file" 
              id="survey-upload" 
              className="hidden" 
              onChange={handleUpload}
              disabled={uploading}
            />
            <label 
              htmlFor="survey-upload"
              className={`w-full py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AI is Parsing...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Select Files
                </>
              )}
            </label>
            <div className="p-4 bg-primary-container/20 rounded-lg border border-primary-container/40 text-left">
              <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle size={10} /> AI Features
              </p>
              <ul className="text-[11px] text-on-primary-container/70 space-y-1 font-medium">
                <li>• Automatic handwriting recognition</li>
                <li>• Categorization of needs</li>
                <li>• Location extraction</li>
                <li>• Priority scoring</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Uploaded History */}
        <div className="col-span-8">
          <div className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-outline/40 bg-surface-variant/20 flex justify-between items-center">
              <h2 className="text-lg font-black text-on-surface">Recent Uploads</h2>
              <Filter size={18} className="text-secondary/40" />
            </div>
            <div className="divide-y-2 divide-outline/30">
              {surveys.map((s) => (
                <div key={s.id} className="p-6 flex items-center justify-between hover:bg-surface-variant/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-surface-variant/40 rounded-lg text-secondary/60">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{s.name}</h4>
                      <p className="text-xs text-secondary/40 font-medium">
                        Uploaded on {s.date} • {s.records} needs extracted
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full uppercase tracking-tighter">
                      {s.status}
                    </span>
                    <button className="text-primary font-black text-xs uppercase tracking-widest hover:underline">
                      View Data
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
