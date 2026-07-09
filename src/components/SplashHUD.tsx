import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SoundCore } from "./SoundCore";
import { SYSTEM_BOOT_LOGS } from "../data";
import splashBg from "../assets/splash_bg.png";

interface SplashProps {
  onComplete: () => void;
  stylishBoyImg: string;
  isDataReady: boolean;
}

export function SplashHUD({ onComplete, stylishBoyImg, isDataReady }: SplashProps) {
  const [splashProgress, setSplashProgress] = useState<number>(0);
  const [splashLogs, setSplashLogs] = useState<string[]>([]);
  const [forceReady, setForceReady] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Safety fallback: if syncing takes more than 3.5 seconds, force proceed
  useEffect(() => {
    const fallback = setTimeout(() => {
      setForceReady(true);
    }, 3500);
    return () => clearTimeout(fallback);
  }, []);

  // Background matrix flow rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "0101010111001MKMODZCYBER88BYPASS7766";
    const charArr = chars.split("");
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const rainDrops: number[] = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(10, 15, 26, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#06b6d4";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < rainDrops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Timer loading progression ticks
  useEffect(() => {
    SoundCore.startSpaceHum();

    const speed = 65;
    const progressInterval = setInterval(() => {
      setSplashProgress((prev) => {
        let increment = 1;
        if (Math.random() > 0.82 && prev > 10 && prev < 95) {
          increment = 0; 
        }
        const next = Math.min(prev + increment, 100);

        if (next % 8 === 0 && increment > 0) {
          SoundCore.playTick();
        }

        const logTriggers = [0, 12, 25, 38, 50, 65, 78, 90, 100];
        const triggerIndex = logTriggers.findIndex((t) => prev < t && next >= t);
        if (triggerIndex !== -1 && triggerIndex < SYSTEM_BOOT_LOGS.length) {
          setSplashLogs((l) => [...l, SYSTEM_BOOT_LOGS[triggerIndex]]);
        }

        if (next >= 100) {
          if (!isDataReady && !forceReady) {
            setSplashLogs((l) => {
              if (!l.includes("SYS: WAITING FOR SECURE CLOUD SYNCHRONIZATION...")) {
                return [...l, "SYS: WAITING FOR SECURE CLOUD SYNCHRONIZATION..."];
              }
              return l;
            });
            return 99; // Hold at 99% until data becomes ready or forced ready
          }

          clearInterval(progressInterval);
          setTimeout(() => {
            SoundCore.playSuccessLaser();
            onComplete();
          }, 1200);
          return 100;
        }
        return next;
      });
    }, speed);

    return () => clearInterval(progressInterval);
  }, [isDataReady, onComplete, forceReady]);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[99999] bg-[#02050a] flex flex-col justify-start sm:justify-center items-center overflow-y-auto py-8 px-4 select-none [perspective:1500px]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-[0.25] z-0" />

      {/* Local high-tech background image */}
      <div className="absolute inset-0 bg-cover bg-center opacity-[0.18] mix-blend-screen pointer-events-none z-0" style={{ backgroundImage: `url(${splashBg})` }} />

      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.08] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/[0.05] blur-[160px] pointer-events-none" />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-10 opacity-75" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,182,212,0.025)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none z-10" />

      <motion.div 
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent shadow-[0_0_15px_rgba(6,182,212,0.5)] pointer-events-none z-25"
      />

      <motion.div 
        initial={{ rotateX: 12, rotateY: -8, scale: 0.95 }}
        animate={{ rotateX: 2, rotateY: -1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative z-20 flex flex-col items-center max-w-xl px-4 sm:px-10 w-full text-center transform-gpu my-auto"
      >
        {/* Radar scope */}
        <div style={{ transform: "translateZ(45px)" }} className="relative w-36 h-36 sm:w-52 sm:h-52 mb-4 sm:mb-6 flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/30 animate-spin" style={{ animationDuration: "35s" }} />
          <div className="absolute inset-2.5 rounded-full border border-purple-500/40 border-t-transparent animate-spin" style={{ animationDuration: "15s", animationDirection: "reverse" }} />
          <div className="absolute inset-5 rounded-full border border-slate-800/60 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/10 animate-pulse" />
          </div>

          <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-left hidden sm:block pointer-events-none font-mono">
            <p className="text-[7px] text-slate-500 font-extrabold tracking-wider">SECURE_CORE</p>
            <p className="text-[9px] text-[#06b6d4] font-black tracking-widest uppercase">V4.2_ELITE</p>
            <p className="text-[7px] text-slate-500 font-extrabold tracking-wider mt-2.5">PROXY_TUNNEL</p>
            <p className="text-[9px] text-purple-400 font-black tracking-widest uppercase">127.0.0.1_OK</p>
          </div>

          <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-right hidden sm:block pointer-events-none font-mono">
            <p className="text-[7px] text-slate-500 tracking-wider">SATELLITE</p>
            <p className="text-[9px] text-emerald-400 font-black tracking-widest uppercase">LINK_ONLINE</p>
            <p className="text-[7px] text-slate-500 mt-2.5">VOLTAGE</p>
            <p className="text-[9px] text-amber-500 font-black tracking-widest">STABLE_1.18V</p>
          </div>

          <svg viewBox="0 0 208 208" className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="104" cy="104" r="76" stroke="rgba(6, 182, 212, 0.04)" strokeWidth="4.5" fill="transparent" />
            <circle 
              cx="104" 
              cy="104" 
              r="76" 
              stroke="url(#eliteNeonGlow)" 
              strokeWidth="4.5" 
              fill="transparent" 
              strokeDasharray="477" 
              strokeDashoffset={477 - (477 * splashProgress) / 100} 
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="eliteNeonGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#9b5de5" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-10 rounded-full border border-cyan-500/10 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-[#00f2fe] rounded-full animate-ping"></div>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-cyber text-2xl sm:text-3xl font-black text-[#00f2fe] tracking-wider drop-shadow-[0_0_15px_rgba(0,242,254,0.7)] font-mono">
              {splashProgress}%
            </span>
            <span className="text-[7px] font-mono text-slate-500 font-extrabold uppercase tracking-[0.25em] mt-1.5">
              DECRYPTING CORE
            </span>
          </div>
        </div>

        {/* Owner Avatar - Hyper Futuristic Cybernetic Gold Edition */}
        <div style={{ transform: "translateZ(35px)" }} className="mb-4 sm:mb-6 flex flex-col items-center shrink-0 relative">
          <div className="absolute inset-0 -m-4 bg-gradient-to-tr from-amber-500/20 via-yellow-500/5 to-cyan-500/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
          
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
            {/* Outer spinning futuristic golden/dashed rings */}
            <div className="absolute inset-0 rounded-full border border-dashed border-amber-500/55 animate-spin" style={{ animationDuration: "10s" }} />
            <div className="absolute -inset-1 rounded-full border border-double border-yellow-500/30 animate-spin" style={{ animationDuration: "6s", animationDirection: "reverse" }} />
            
            {/* Golden Frame with high-fidelity glow */}
            <div className="w-15 h-15 sm:w-18 sm:h-18 rounded-2xl p-[1.5px] bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.65)] relative overflow-hidden">
              <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-950 border border-slate-900/50 relative">
                <img src={stylishBoyImg} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" alt="Umar Malang" />
                
                {/* Holographic scanning laser line on avatar */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/25 to-transparent pointer-events-none animate-scan-fast" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none opacity-60" />
              </div>
            </div>
            
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 mt-2 bg-gradient-to-r from-amber-950/50 to-yellow-950/20 px-3 py-1 border border-amber-500/35 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
            <span className="text-[7.5px] font-mono text-yellow-300 font-extrabold tracking-[0.18em] uppercase">
              SYS_OWNER: UMAR MALANG
            </span>
          </div>
        </div>

        {/* Branding Title */}
        <div style={{ transform: "translateZ(30px)" }} className="space-y-2 sm:space-y-3.5 shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/5 border border-cyan-500/25 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[7.5px] sm:text-[8px] font-mono text-cyan-300 font-extrabold uppercase tracking-[0.15em]">SECURE HIGH-END COMPILER MODULE</span>
          </div>
          
          <h1 className="font-cyber text-2xl sm:text-4xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-white uppercase drop-shadow-[0_0_25px_rgba(0,242,254,0.5)]">
            MKMODZ <span className="text-cyan-400">ELITE</span>
          </h1>
          <p className="font-mono text-[7.5px] sm:text-[9px] text-indigo-400/80 tracking-[0.2em] sm:tracking-[0.3em] font-extrabold uppercase">
            ESTABLISHING CRYPTOGRAPHIC BYPASS DECODER
          </p>
        </div>

        {/* Segmented Loading Bar */}
        <div style={{ transform: "translateZ(20px)" }} className="w-full max-w-xs sm:max-w-sm mt-5 sm:mt-8 shrink-0">
          <div className="flex gap-1 justify-between p-1.5 bg-slate-950/85 border border-slate-900 rounded-2xl">
            {Array.from({ length: 22 }).map((_, idx) => {
              const threshold = (idx + 1) * (100 / 22);
              const isActive = splashProgress >= threshold;
              return (
                <div 
                  key={idx}
                  className={`h-5 sm:h-7 flex-1 rounded-[3px] transition-all duration-300 relative overflow-hidden ${
                    isActive 
                      ? "bg-gradient-to-t from-[#00f2fe] via-[#00f2fe]/80 to-[#9b5de5] shadow-[0_0_12px_rgba(0,242,254,0.6)]" 
                      : "bg-slate-950/90 border border-slate-900/40"
                  }`}
                >
                  {isActive && <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_100%,transparent)] animate-pulse" />}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center px-1.5 mt-2 text-[7px] sm:text-[7.5px] font-mono text-slate-500 font-black tracking-widest uppercase">
            <span>BYTE SCANNER STREAM: READY</span>
            <span className="text-[#00f2fe] animate-pulse">MEM_MAP_INITIALISED_SUCCESS</span>
          </div>
        </div>

        {/* Ticker logs */}
        <div style={{ transform: "translateZ(10px)" }} className="w-full mt-4 sm:mt-6 bg-[#03060a]/95 border border-slate-900/90 rounded-[20px] sm:rounded-[24px] p-3 sm:p-4 text-left font-mono text-[8px] sm:text-[9px] text-cyan-400 min-h-24 max-h-28 sm:min-h-36 sm:max-h-40 overflow-y-auto space-y-1.5 sm:space-y-2 relative scrollbar-none shrink-0">
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#03060a] to-transparent pointer-events-none z-10" />
          <div className="text-slate-500 uppercase tracking-widest font-black text-[7px] sm:text-[7.5px] border-b border-slate-900/80 pb-2 mb-2 flex justify-between">
            <span>🔐 DECRYPTION SYSTEM BYPASS HANDSHAKE</span>
            <span className="animate-pulse text-cyan-400 font-bold">ACTIVE STATUS: OK</span>
          </div>
          {splashLogs.map((log, index) => (
            <div key={index} className="flex gap-2 leading-relaxed items-start">
              <span className="text-indigo-400 font-black shrink-0 text-[7.5px] sm:text-[8px]">❯_0{index + 1}</span>
              <span className="text-slate-300 tracking-wide uppercase text-[7.5px] sm:text-[8.5px]">{log}</span>
            </div>
          ))}
        </div>

        {/* Handshake status panel */}
        <div style={{ transform: "translateZ(15px)" }} className="w-full mt-4 sm:mt-5 bg-gradient-to-b from-amber-950/15 to-[#03060a]/90 border border-amber-500/35 rounded-[16px] sm:rounded-[20px] p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4 text-left shadow-[0_8px_35px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.08)] shrink-0 font-mono">
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950 shrink-0">
            <img src={stylishBoyImg} className="w-full h-full object-cover" alt="Umar Malang" />
            <motion.div 
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-[1.5px] bg-amber-400 shadow-[0_0_8px_#fbbf24] pointer-events-none"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[6.5px] sm:text-[7px] text-slate-500 uppercase tracking-widest font-black leading-none">
              AUTHORIZED HANDSHAKE OBJECT
            </div>
            <h4 className="text-[10px] sm:text-[11px] text-slate-200 font-extrabold tracking-wider uppercase mt-1 truncate">
              ✬𐇽𝐌𝆊𐇽𝐊⃭⃭𝆊𝐌𝆊𐇽𝐊𝆊𐇽𝝧𝆊𐇽𝐃𝆊𐇽𝐙✭👑
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-amber-400" />
              </span>
              <span className="text-[7px] sm:text-[7.5px] text-amber-400 font-black tracking-widest uppercase animate-pulse">
                CLEARANCE_MAX_LEVEL
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
