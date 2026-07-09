import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Terminal, Database, Wifi } from "lucide-react";

export function ScanningHUD() {
  const [progress, setProgress] = useState(0);
  const [logIndex, setLogIndex] = useState(0);

  const scanLogs = [
    "LOG: INITIATING SECURE SYSTEM DEPLOYMENT...",
    "LOG: ESTABLISHING HANDSHAKE WITH FIREBASE CLOUD MATRIX...",
    "LOG: SCANNING DATABASE NODE CLUSTERS [mkmo-e429c]...",
    "LOG: BYPASSING REGIONAL FIREWALL FILTERS...",
    "LOG: FETCHING SECURE TELEMETRY DEPLOYMENT INJECTORS...",
    "LOG: VERIFYING CRYPTOGRAPHIC SHA-256 SIGNATURES...",
    "LOG: INTEGRATING ACTIVE USER BYPASS TUNNEL...",
    "LOG: RETRIEVING LIVE STATUS CHANNELS...",
    "LOG: ALL SYSTEMS GREEN. DIRECTORY STANDBY SECURED."
  ];

  useEffect(() => {
    // Progress incrementer
    const progInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progInterval);
          return 100;
        }
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + step, 100);
      });
    }, 120);

    // Dynamic log rotator
    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev < scanLogs.length - 1 ? prev + 1 : prev));
    }, 450);

    return () => {
      clearInterval(progInterval);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div className="col-span-full bg-gradient-to-b from-[#09111e]/95 to-[#040810]/98 border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.25)] select-none animate-pulse-slow">
      {/* Sci-fi tech border corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />

      {/* Grid overlay lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.025)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-[24px]" />
      
      {/* Laser sweeping light bar */}
      <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_25px_#22d3ee] pointer-events-none z-10"
      />

      {/* Sci-Fi Radar Scope Indicator */}
      <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
        {/* Outer spinning brackets */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/20 animate-spin" style={{ animationDuration: "12s" }} />
        <div className="absolute inset-2 rounded-full border border-purple-500/30 border-t-transparent animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
        <div className="absolute inset-6 rounded-full border border-cyan-500/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <span className="text-sm font-mono font-black text-cyan-400 tracking-tighter">
              {progress}%
            </span>
          </div>
        </div>
        
        {/* Shaded scanning wedge sweep */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/0 via-cyan-500/[0.08] to-cyan-500/0 animate-spin" style={{ animationDuration: "2.8s" }} />

        {/* Outer dynamic glowing beacons */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
      </div>

      {/* Scanning Text details */}
      <div className="text-center space-y-4 relative z-10 max-w-md w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span className="text-[9px] font-mono text-cyan-300 font-extrabold uppercase tracking-[0.2em]">CLOUD TELEMETRY INITIATED</span>
        </div>
        
        <h4 className="font-cyber text-lg font-black text-white uppercase tracking-[0.25em] drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
          SYNCHRONIZING SECURE SYSTEMS
        </h4>
        
        {/* Real dynamic progress bar */}
        <div className="w-full bg-slate-950 border border-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full shadow-[0_0_10px_#22d3ee]"
          />
        </div>

        {/* Real-time scrolling log screen */}
        <div className="w-full bg-slate-950/90 border border-slate-900/80 p-4 rounded-2xl text-[9px] font-mono space-y-2 text-left mt-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] border-t-cyan-500/20 max-h-[100px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-slate-900/60 pb-1.5 text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-cyan-400" /> SYSTEM DIAGNOSTICS LOG
            </span>
            <span className="text-[8px] text-cyan-500/70">SECURE SHELL</span>
          </div>
          
          <div className="space-y-1 text-slate-300 font-semibold leading-relaxed">
            {scanLogs.slice(Math.max(0, logIndex - 2), logIndex + 1).map((log, idx) => (
              <div 
                key={idx} 
                className={`flex gap-1.5 ${idx === logIndex - Math.max(0, logIndex - 2) ? "text-cyan-400" : "text-slate-500"}`}
              >
                <span className="text-cyan-500/50">▶</span>
                <span className="break-all">{log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* High-tech status grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          <div className="bg-[#0b1424]/60 border border-slate-800/80 p-3 rounded-xl text-left">
            <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider mb-1">DATABASE CONNECTED</span>
            <span className="text-cyan-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
              <Database className="w-3 h-3 text-cyan-500" /> mkmo-e429c
            </span>
          </div>
          <div className="bg-[#0b1424]/60 border border-slate-800/80 p-3 rounded-xl text-left">
            <span className="text-[8px] text-slate-500 font-black block uppercase tracking-wider mb-1">NETWORK GATEWAY</span>
            <span className="text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" /> CLOUD SECURED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
