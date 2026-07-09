import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Terminal, 
  Settings, 
  Clock, 
  Cpu, 
  ShieldAlert, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Users, 
  Crown,
  Key,
  LogOut,
  Globe,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Check,
  Upload,
  X,
  Info,
  Bell,
  BellRing,
  Music
} from "lucide-react";
import { SoundCore } from "./components/SoundCore";
import { db } from "./firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { ToolItem } from "./types";
import { SplashHUD } from "./components/SplashHUD";
import homeBg from "./assets/home_bg.png";
import boyImg from "./assets/boy.png";

const stylishBoyImg = boyImg;

// Helper functions for safe local storage
const safeGetItem = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

const safeRemoveItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

export default function App() {
  // --- CORE TERMINAL STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return safeGetItem("stand_loggedIn", "false") === "true";
  });
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  
  const [terminalFeatures, setTerminalFeatures] = useState<ToolItem[]>(() => {
    const cached = safeGetItem("stand_features", "");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });
  const terminalFeaturesRef = useRef<ToolItem[]>(terminalFeatures);
  const isSeedingRef = useRef<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [terminalSearchQuery, setTerminalSearchQuery] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [terminalCategory, setTerminalCategory] = useState<string>("ALL");

  // Debounce search input to avoid excessive list filtering and focus cuts
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setTerminalSearchQuery(searchInput);
    }, 180);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);
  
  const [terminalClock, setTerminalClock] = useState<string>("");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSongPlaying, setIsSongPlaying] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(731);
  const [firebaseStatus, setFirebaseStatus] = useState<"ACTIVE" | "OFFLINE/CACHED">("ACTIVE");

  // Auth Inputs
  const [authName, setAuthName] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPass, setAuthPass] = useState<string>("");

  // UI States
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  
  // High-Tech Auth Scanning States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "success" | "error" | "info" }>({
    show: false,
    msg: "",
    type: "info"
  });

  interface AppNotification {
    id: string;
    title: string;
    description: string;
    category: string;
    time: string;
    read: boolean;
  }

  // Dialog & Drawer toggles
  const [showSideDrawer, setShowSideDrawer] = useState<boolean>(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);
  const [showAdminDrawer, setShowAdminDrawer] = useState<boolean>(false);
  const [showWelcomeBriefing, setShowWelcomeBriefing] = useState<boolean>(false);
  const [showPromoAd, setShowPromoAd] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = safeGetItem("stand_notifications", "[]");
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    safeSetItem("stand_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // New tool creation state
  const [newToolName, setNewToolName] = useState("");
  const [newToolLink, setNewToolLink] = useState("");
  const [newToolImg, setNewToolImg] = useState("");
  const [newToolCat, setNewToolCat] = useState<"Aim Mods" | "Sensors" | "Bypass" | "Security">("Bypass");
  const [newToolDesc, setNewToolDesc] = useState("");

  // Profile status state
  const [userData, setUserData] = useState<{ name: string; userId: string; pfp: string }>(() => {
    try {
      const saved = safeGetItem("stand_user", "");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: "MK-MODZ",
      userId: "MK-" + Math.floor(1000 + Math.random() * 9000),
      pfp: stylishBoyImg || "https://ui-avatars.com/api/?name=MK&background=06b6d4&color=0f172a&bold=true"
    };
  });

  const [customBase64, setCustomBase64] = useState<string>("");

  // --- TRIGGER TOASTS ---
  const triggerToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, msg, type });
    if (type === "success") {
      SoundCore.playSuccessLaser();
    } else {
      SoundCore.playTick();
    }
  };

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(t);
    }
    return () => {};
  }, [toast.show]);

  // --- REAL-TIME FLUTTER FOR ONLINE COUNTERS ---
  useEffect(() => {
    if (showSplash) return () => {};
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return next < 700 ? 731 : next > 760 ? 731 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [showSplash]);

  // --- SOUND TOGGLE ---
  const toggleMute = () => {
    SoundCore.playTick();
    setIsMuted(!isMuted);
    if (!isMuted) {
      SoundCore.stopSpaceHum();
    } else {
      SoundCore.startSpaceHum();
    }
  };

  // --- AUTOMATIC LOADING SYNC SOUND TRIGGER ---
  useEffect(() => {
    if (!isLoggedIn || showSplash) {
      SoundCore.stopSyncSound();
      return () => {};
    }

    if (isSyncing) {
      SoundCore.playSyncSound();
    } else {
      SoundCore.stopSyncSound();
    }

    return () => {
      SoundCore.stopSyncSound();
    };
  }, [isSyncing, isLoggedIn, showSplash]);

  // --- REAL-TIME CLOCK ---
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      setTerminalClock(`${hh}:${mm}:${ss}`);
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  // --- SHOW WELCOME BRIEFING ONCE PER SESSION ---
  useEffect(() => {
    if (isLoggedIn && !showSplash) {
      try {
        const seen = sessionStorage.getItem("stand_seenBriefing") === "true";
        if (!seen) {
          setTimeout(() => {
            setShowWelcomeBriefing(true);
            SoundCore.playSuccessLaser();
          }, 600);
        }
      } catch (e) {
        setShowWelcomeBriefing(true);
      }
    }
  }, [isLoggedIn, showSplash]);

  // --- AUTOMATIC HIGH-FIDELITY PROMO AD TRIGGER SYSTEM ---
  useEffect(() => {
    if (!isLoggedIn || showSplash) return () => {};
    
    const interval = setInterval(() => {
      setShowPromoAd(true);
      SoundCore.playSuccessLaser();
    }, 100000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn, showSplash]);

  // --- FIREBASE AND LOCAL STORAGE RETRIEVAL ENGINE ---
  useEffect(() => {
    if (!isLoggedIn) {
      setTerminalFeatures([]);
      terminalFeaturesRef.current = [];
      setSelectedTool(null);
      setIsSyncing(false);
      return () => {};
    }

    const cached = safeGetItem("stand_features", "");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setTerminalFeatures(parsed);
          terminalFeaturesRef.current = parsed;
          setSelectedTool(parsed[0]);
        }
      } catch (e) {
        console.error("Local features parsing error", e);
      }
    }

    // Force isSyncing to true on load/login to show high-tech Scanning HUD during network fetch
    setIsSyncing(true);
    const syncStartTime = Date.now();

    // Safety fallback timeout: if remote database sync doesn't respond in 4.5 seconds, force proceed cleanly
    const safetyTimeout = setTimeout(() => {
      console.warn("Firestore onSnapshot sync exceeded threshold. Reverting to cached high-performance flow.");
      setIsSyncing(false);
    }, 4500);

    try {
      if (!db) {
        clearTimeout(safetyTimeout);
        setFirebaseStatus("OFFLINE/CACHED");
        setTimeout(() => {
          setIsSyncing(false);
        }, 1500);
        return () => {};
      }

      const featuresRef = collection(db, "features");
      const unsubscribe = onSnapshot(featuresRef, (snapshot) => {
        clearTimeout(safetyTimeout);
        const cloudItems: ToolItem[] = [];
        snapshot.forEach((doc) => {
          cloudItems.push({ id: doc.id, ...(doc.data() as Omit<ToolItem, "id">) });
        });

        setTerminalFeatures(cloudItems);
        terminalFeaturesRef.current = cloudItems;
        
        // Dynamic notifications for newly added tools from admin panel
        const seenIdsStr = safeGetItem("stand_seen_tool_ids", "[]");
        let seenIds: string[] = [];
        try {
          seenIds = JSON.parse(seenIdsStr);
        } catch (e) {}

        if (seenIds.length === 0 && cloudItems.length > 0) {
          // Initialize list on first scan so existing items don't spark spam notifications
          seenIds = cloudItems.map(item => item.id);
          safeSetItem("stand_seen_tool_ids", JSON.stringify(seenIds));
        } else if (cloudItems.length > 0) {
          const newTools = cloudItems.filter(item => !seenIds.includes(item.id));
          if (newTools.length > 0) {
            const newNotifs = newTools.map(t => ({
              id: t.id + "-" + Date.now(),
              title: `NEW INJECTOR: ${t.name}`,
              description: `${t.category} bypass signature has been added.`,
              category: t.category,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false
            }));

            setNotifications(prev => [...newNotifs, ...prev]);

            const updatedSeenIds = [...seenIds, ...newTools.map(t => t.id)];
            safeSetItem("stand_seen_tool_ids", JSON.stringify(updatedSeenIds));

            SoundCore.playSuccessLaser();
            triggerToast(`🚨 NEW ACCELERATOR: "${newTools[0].name}" has been loaded!`, "success");
          }
        }

        if (cloudItems.length > 0) {
          setSelectedTool((prev) => {
            if (prev) {
              const matched = cloudItems.find(x => x.id === prev.id);
              return matched || cloudItems[0];
            }
            return cloudItems[0];
          });
        } else {
          setSelectedTool(null);
        }

        safeSetItem("stand_features", JSON.stringify(cloudItems));
        setFirebaseStatus("ACTIVE");
        
        // Enforce a minimum scan time of 1.5 seconds for a premium, high-fidelity HUD experience
        const elapsed = Date.now() - syncStartTime;
        const delay = Math.max(1500 - elapsed, 0);
        setTimeout(() => {
          setIsSyncing(false);
        }, delay);
        isSeedingRef.current = false;
      }, (error) => {
        clearTimeout(safetyTimeout);
        console.warn("Firestore error:", error);
        setFirebaseStatus("OFFLINE/CACHED");
        const elapsed = Date.now() - syncStartTime;
        const delay = Math.max(1500 - elapsed, 0);
        setTimeout(() => {
          setIsSyncing(false);
        }, delay);
      });

      return () => {
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch (err) {
      clearTimeout(safetyTimeout);
      console.warn("Database init failed. Using offline backup.", err);
      setFirebaseStatus("OFFLINE/CACHED");
      const elapsed = Date.now() - syncStartTime;
      const delay = Math.max(1500 - elapsed, 0);
      setTimeout(() => {
        setIsSyncing(false);
      }, delay);
      if (terminalFeaturesRef.current.length === 0) {
        setTerminalFeatures([]);
        terminalFeaturesRef.current = [];
        setSelectedTool(null);
      }
      return () => {};
    }
  }, [isLoggedIn]);

  // --- HANDLE AUTH (LOGIN / REGISTER) ---
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    SoundCore.playTick();

    if (!authEmail || !authPass) {
      triggerToast("Operator Email and Passcode are required!", "error");
      return;
    }

    if (isSignUpMode && !authName.trim()) {
      triggerToast("Operator Signature Name is required!", "error");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus("RESOLVING AUTH ENDPOINTS");
    setScanLogs([
      "SYS: Connecting to Firebase Cloud Cluster...",
      "SYS: Preparing secure Diffie-Hellman cryptographic exchange..."
    ]);

    let progress = 0;
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 12) + 6;

      if (progress + increment >= 90 && isSyncing) {
        progress = 90;
        setScanStatus("SYNCHRONIZING SECURE DATABASE CLUSTER");
        setScanLogs((prev) => {
          if (!prev.includes("DB: Streaming bypass configurations from cloud...")) {
            SoundCore.playTick();
            return [
              ...prev,
              "DB: Streaming bypass configurations from cloud...",
              "SYS: Awaiting real-time Firestore database handshake..."
            ];
          }
          return prev;
        });
      } else {
        progress += increment;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          setTimeout(() => {
            setIsScanning(false);
            if (isSignUpMode) {
              const displayName = authName.trim() || "MK-USER";
              const uId = "MK-" + Math.floor(1000 + Math.random() * 9000);
              const newProfile = {
                name: displayName,
                userId: uId,
                pfp: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=06b6d4&color=0f172a&bold=true`
              };
              setUserData(newProfile);
              safeSetItem("stand_user", JSON.stringify(newProfile));
              safeSetItem("stand_loggedIn", "true");
              setIsLoggedIn(true);
              triggerToast("Operator key compiled! Welcome to HUD Dashboard.", "success");
            } else {
              safeSetItem("stand_loggedIn", "true");
              setIsLoggedIn(true);
              triggerToast("Permissions authorized! Welcome to HUD Dashboard.", "success");
            }
          }, 500);
        }
      }
      setScanProgress(progress);

      if (progress > 15 && progress <= 35) {
        setScanStatus("COMPILING CRYPTO SIGNATURE");
        setScanLogs((prev) => {
          if (prev.length === 2) {
            SoundCore.playTick();
            return [
              ...prev,
              "SEC: Cipher keys constructed: AES-256 GCM authenticated.",
              "SEC: Verifying email signature hashes with Firestore Auth server..."
            ];
          }
          return prev;
        });
      } else if (progress > 35 && progress <= 65) {
        setScanStatus("SYNCHRONIZING TELEMETRY LIBRARIES");
        setScanLogs((prev) => {
          if (prev.length === 4) {
            SoundCore.playTick();
            return [
              ...prev,
              "DB: Firestore persistent client local cache: READY.",
              "DB: Downloading available mods signature keys..."
            ];
          }
          return prev;
        });
      } else if (progress > 65 && progress <= 85) {
        setScanStatus("DECRYPTING BYPASS SYSTEM CODES");
        setScanLogs((prev) => {
          if (prev.length === 6) {
            SoundCore.playTick();
            return [
              ...prev,
              "SYS: Decoupling MT decompiler and smali refactoring units...",
              "SEC: 4 high-fidelity bypass injectors mapped in cache memory."
            ];
          }
          return prev;
        });
      } else if (progress > 85 && progress < 100) {
        setScanStatus("AUTHORIZING INGRESS CHANNELS");
        setScanLogs((prev) => {
          if (prev.length === 8) {
            SoundCore.playSuccessLaser();
            return [
              ...prev,
              "SYS: Handshake success! Initializing Elite HUD Dashboard overlay."
            ];
          }
          return prev;
        });
      }
    }, 140);
  };

  // --- LOGOUT SESSION ---
  const handleLogout = () => {
    SoundCore.playTick();
    safeRemoveItem("stand_loggedIn");
    safeRemoveItem("stand_features");
    setTerminalFeatures([]);
    terminalFeaturesRef.current = [];
    setSelectedTool(null);
    setIsLoggedIn(false);
    setShowSideDrawer(false);
    setShowProfileDrawer(false);
    setShowAdminDrawer(false);
    triggerToast("Session security terminated cleanly.", "info");
  };

  // --- PROFILE CUSTOMIZE ---
  const previewPfpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const resultStr = evt.target?.result as string;
      const img = new Image();
      img.src = resultStr;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 300;
        let w = img.width;
        let h = img.height;
        
        if (w > maxW) {
          h *= maxW / w;
          w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        
        const b64 = canvas.toDataURL("image/jpeg", 0.6);
        setCustomBase64(b64);
        triggerToast("Avatar compiled & optimized!", "success");
      };
    };
    reader.readAsDataURL(file);
  };

  const saveProfileData = () => {
    SoundCore.playTick();
    const updated = {
      ...userData,
      name: authName.trim() || userData.name,
      pfp: customBase64 || userData.pfp
    };
    setUserData(updated);
    safeSetItem("stand_user", JSON.stringify(updated));
    triggerToast("Profile rewritten cleanly!", "success");
    setShowProfileDrawer(false);
  };

  // --- COMPILING & DEPLOYING CUSTOM INJECTOR ---
  const handleDeployCustomMod = async (e: React.FormEvent) => {
    e.preventDefault();
    SoundCore.playTick();

    if (!newToolName || !newToolLink) {
      triggerToast("Mod Name and Payload Link are required!", "error");
      return;
    }

    const modId = "custom-" + Date.now();
    const imageToUse = newToolImg.trim() || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop";
    
    const deployedData: ToolItem = {
      id: modId,
      name: newToolName,
      link: newToolLink,
      img: imageToUse,
      category: newToolCat,
      status: "ACTIVE",
      description: newToolDesc.trim() || "User injected diagnostic bypass signature profile."
    };

    try {
      if (!db) {
        const localFeatures = [deployedData, ...terminalFeatures];
        setTerminalFeatures(localFeatures);
        safeSetItem("stand_features", JSON.stringify(localFeatures));
        triggerToast("Bypass Injector deployed locally (Sandbox Mode)!", "success");
        setNewToolName("");
        setNewToolLink("");
        setNewToolImg("");
        setNewToolDesc("");
        setShowAdminDrawer(false);
        return;
      }

      const docRef = doc(db, "features", modId);
      await setDoc(docRef, {
        name: deployedData.name,
        link: deployedData.link,
        img: deployedData.img,
        category: deployedData.category,
        status: deployedData.status,
        description: deployedData.description,
        details: ["INJECTED PROTOCOL", "ONLINE BYPASS SIGNATURE"]
      });

      setTerminalFeatures((prev) => [deployedData, ...prev]);
      triggerToast("Bypass Injector deployed to Firebase!", "success");

      setNewToolName("");
      setNewToolLink("");
      setNewToolImg("");
      setNewToolDesc("");
      setShowAdminDrawer(false);
    } catch (err) {
      console.error("Firestore Upload Error:", err);
      triggerToast("Deployment failed! Check internet connection.", "error");
    }
  };

  // --- DELETE MOD ---
  const handleDeleteMod = async (id: string) => {
    SoundCore.playTick();
    try {
      if (!db) {
        setTerminalFeatures((prev) => prev.filter((x) => x.id !== id));
        triggerToast("Signature de-authorized cleanly (Sandbox Mode).", "success");
        return;
      }
      await deleteDoc(doc(db, "features", id));
      setTerminalFeatures((prev) => prev.filter((x) => x.id !== id));
      triggerToast("Signature de-authorized cleanly.", "success");
    } catch (err) {
      console.error("Delete mod error:", err);
      setTerminalFeatures((prev) => prev.filter((x) => x.id !== id));
      triggerToast("Removed locally (Check Database Permissions).", "info");
    }
  };

  const handleRefreshBypasses = () => {
    SoundCore.playTick();
    setIsSyncing(true);
    triggerToast("Initiating secure remote directory scan...", "info");
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast("Bypass directory re-scanned cleanly!", "success");
    }, 1500);
  };

  const handleOpenAdminWithPasscode = () => {
    SoundCore.playTick();
    setShowSideDrawer(false);
    setPasscodeInput("");
    setShowPasscodeModal(true);
  };

  // Filter tools listing based on inputs with safe property checks
  const filteredTools = terminalFeatures
    .filter(f => f && (terminalCategory === "ALL" || f.category === terminalCategory))
    .filter(f => {
      const name = f?.name || "";
      const desc = f?.description || "";
      const query = terminalSearchQuery || "";
      return name.toLowerCase().includes(query.toLowerCase()) || 
             desc.toLowerCase().includes(query.toLowerCase());
    });

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 relative">
      
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[#04060b] -z-10 overflow-hidden">
        {/* Local ultra-premium mainframe background image */}
        <div className="absolute inset-0 bg-cover bg-center opacity-[0.15] mix-blend-screen pointer-events-none" style={{ backgroundImage: `url(${homeBg})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(34,211,238,0.06),transparent_100%)]" />
      </div>

      <div className="fixed inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#06b6d4]/40 to-transparent pointer-events-none z-50 animate-laser-scan" />

      {/* 1. TOAST NOTIFICATION HUD */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ translateY: -100, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -100, opacity: 0 }}
            className="fixed top-6 inset-x-4 max-w-sm mx-auto z-[999999] bg-[#070b13]/95 border-2 rounded-2xl p-4 flex gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md"
            style={{ 
              borderColor: toast.type === "success" 
                ? "rgba(16, 185, 129, 0.6)" 
                : toast.type === "error" 
                ? "rgba(239, 68, 68, 0.6)" 
                : "rgba(6, 182, 212, 0.6)" 
            }}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : toast.type === "error" ? (
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              ) : (
                <Info className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                {toast.type === "success" ? "TRANSMISSION SECURED" : toast.type === "error" ? "PROTOCOL FAILURE" : "SYSTEM MESSAGE"}
              </h4>
              <p className="text-xs font-mono font-bold text-slate-200 mt-1 leading-relaxed uppercase">
                {toast.msg}
              </p>
            </div>
            <button onClick={() => setToast((p) => ({ ...p, show: false }))} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SPLASH SCREEN WITH DATA LOAD SECURED */}
      <AnimatePresence>
        {showSplash && (
          <SplashHUD 
            stylishBoyImg={stylishBoyImg}
            isDataReady={!isSyncing}
            onComplete={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>

      {/* 3. SECURE GATEWAY / LOGIN SCREEN */}
      <AnimatePresence>
        {!showSplash && !isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="min-h-screen flex items-center justify-center p-4 relative z-10"
          >
            <div className="w-full max-w-md bg-[#070b13]/90 border border-[#22d3ee]/25 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent" />
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce" style={{ animationDuration: "3s" }}>
                  <ShieldAlert className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="font-cyber text-2xl font-black text-white tracking-widest uppercase">
                  {isSignUpMode ? "KEY CREATOR" : "SECURE GATEWAY"}
                </h2>
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
                  {isSignUpMode ? "REGISTER NEW SIGNATURE" : "VERIFY ACCESS KEY CODES"}
                </p>
              </div>
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isSignUpMode && (
                  <div>
                    <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                      Operator Signature Name
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                      <input 
                        type="text" 
                        required
                        disabled={isScanning}
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Killers~Boy" 
                        className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl py-3.5 pl-11 pr-4 text-xs font-mono text-cyan-300 outline-none uppercase transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                    Encrypted Email Address
                  </label>
                  <div className="relative">
                    <Terminal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                    <input 
                      type="email" 
                      required
                      disabled={isScanning}
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="operator@mkmodz.net" 
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl py-3.5 pl-11 pr-4 text-xs font-mono text-cyan-300 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                    Passcode / Key Payload
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
                    <input 
                      type="password" 
                      required
                      disabled={isScanning}
                      value={authPass}
                      onChange={(e) => setAuthPass(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl py-3.5 pl-11 pr-4 text-xs font-mono text-cyan-300 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                
                {isScanning ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="space-y-4 p-5 bg-gradient-to-b from-[#09101e] to-[#03060a] border-2 border-cyan-500/40 rounded-2xl relative overflow-hidden mt-4 text-left font-mono"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
                    <motion.div 
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee,0_0_20px_#06b6d4] pointer-events-none z-10"
                    />

                    <div className="flex items-center gap-3 border-b border-slate-900 pb-3">
                      <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/40 animate-spin" />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block">SYSTEM INTEGRATION PROCESS</span>
                        <h4 className="text-[10px] text-cyan-400 font-extrabold tracking-wider uppercase truncate animate-pulse">
                          {scanStatus}
                        </h4>
                      </div>
                      
                      <div className="text-right text-xs font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                        {scanProgress}%
                      </div>
                    </div>

                    <div className="w-full bg-slate-950 border border-slate-900 h-3 rounded-xl overflow-hidden relative p-[2px]">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-[#9d4edd] rounded-lg transition-all duration-150 relative shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>

                    <div className="bg-[#020408] border border-slate-900/80 p-3 rounded-xl text-[8px] text-slate-400 space-y-1.5 h-28 overflow-y-auto scrollbar-none text-left relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                      {scanLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <span className="text-cyan-500/60 shrink-0 select-none">❯</span>
                          <span className="text-slate-300 tracking-wide leading-relaxed">{log}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black font-mono text-xs tracking-widest rounded-xl transition-all uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 mt-2 shadow-[0_4px_20px_rgba(6,182,212,0.3)]"
                  >
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {isSignUpMode ? "GENERATE SECURITY CREDENTIALS" : "SYSTEM RECON_MODE INITIATION"}
                    </span>
                  </button>
                )}
              </form>
              
              <div className="mt-6 text-center">
                <button 
                  disabled={isScanning}
                  onClick={() => {
                    SoundCore.playTick();
                    setIsSignUpMode(!isSignUpMode);
                  }}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 tracking-widest uppercase transition-all bg-transparent border-none cursor-pointer"
                >
                  {isSignUpMode 
                    ? "ALREADY GENERATED? AUTHORIZE ACCESS" 
                    : "LACKING SIGNATURE KEY? CREATE CREDENTIALS"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MAIN DASHBOARD HUD CONTAINER PANEL */}
      <AnimatePresence>
        {!showSplash && isLoggedIn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 py-6 md:px-8 max-w-7xl mx-auto relative z-10"
          >
            {/* TOP DYNAMIC HUD HEADER */}
            <header className="mb-8 bg-[#070b13]/85 border border-[#22d3ee]/15 px-6 py-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_0_20px_rgba(6,182,212,0.05)] backdrop-blur-md">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div 
                  onClick={() => {
                    SoundCore.playTick();
                    setShowProfileDrawer(true);
                  }}
                  className="relative w-14 h-14 rounded-full p-0.5 border-2 border-cyan-500/30 hover:border-cyan-400 transition shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer group shrink-0"
                >
                  <img 
                    src={userData.pfp} 
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition"
                    alt="Operator Avatar" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#04060b] animate-pulse" />
                </div>
                <div className="text-left font-mono">
                  <div className="flex items-center gap-2">
                    <h3 className="font-cyber text-lg font-black text-white tracking-wider uppercase leading-none font-sans">
                      {userData.name}
                    </h3>
                    <Crown className="w-4 h-4 text-[#ffd700] animate-bounce" style={{ animationDuration: "4s" }} />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SEC_CLEARANCE:</span>
                    <span className="text-[10px] text-cyan-400 font-extrabold tracking-widest select-all uppercase">
                      {userData.userId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block text-center flex-1 max-w-sm px-4">
                <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 font-sans">
                  MKMODZ <span className="text-cyan-400">HUD</span>
                </h1>
                <p className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.3em] font-bold mt-1">
                  SECURE CRYPTOGRAPHIC INJECTOR v2
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 border-slate-900/40 pt-4 md:pt-0 font-mono">
                <div className="flex items-center gap-1.5 bg-[#070b13]/85 border border-[#22d3ee]/10 px-3 py-1.5 rounded-xl text-xs font-bold tracking-widest text-cyan-400 shadow-inner">
                  <Clock className="w-3.5 h-3.5 text-slate-500 animate-spin" style={{ animationDuration: "16s" }} />
                  <span>{terminalClock}</span>
                </div>

                <div className="px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-xl flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${firebaseStatus === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-ping"}`} />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {firebaseStatus}
                  </span>
                </div>

                {/* HIGH-FIDELITY BG SONG TOGGLE BUTTON */}
                <button
                  onClick={() => {
                    const active = SoundCore.toggleSong();
                    setIsSongPlaying(active);
                    triggerToast(active ? "🎵 SONG PLAYBACK STARTED" : "🎵 SONG PLAYBACK STOPPED", "success");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-mono font-black tracking-widest transition uppercase flex items-center gap-1.5 cursor-pointer border ${
                    isSongPlaying 
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-[1.03]" 
                      : "bg-slate-950 hover:bg-slate-900 text-amber-500 border-amber-500/20 hover:border-amber-500/50"
                  }`}
                  title={isSongPlaying ? "Turn background song OFF" : "Turn background song ON"}
                >
                  <Music className={`w-3.5 h-3.5 ${isSongPlaying ? "animate-bounce text-slate-950" : "text-amber-500"}`} />
                  <span>{isSongPlaying ? "SONG_ON" : "SONG_OFF"}</span>
                </button>

                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-900 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition"
                  title={isMuted ? "Unmute Space Hum" : "Mute Space Hum"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* NOTIFICATION BELL ICON WITH ACTIVE BADGE */}
                <button
                  onClick={() => {
                    SoundCore.playTick();
                    setShowNotificationsDrawer(true);
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-900 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition relative group"
                  title="System Notifications / Alerts"
                >
                  <motion.div
                    animate={notifications.filter(n => !n.read).length > 0 ? { rotate: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2, repeatType: "mirror" }}
                  >
                    <Bell className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                  </motion.div>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-gradient-to-r from-rose-500 to-pink-600 border border-slate-950 text-[8px] font-mono font-black text-white items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    SoundCore.playTick();
                    setShowSideDrawer(true);
                  }}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[10px] font-black tracking-widest rounded-xl transition uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                >
                  <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
                  <span>MENU</span>
                </button>
              </div>
            </header>

            {/* SLICED HUD METRICS STATUS BAR */}
            <div className="bg-gradient-to-r from-[#070b13] via-[#0b1424] to-[#070b13] border border-slate-800/60 px-5 py-3.5 rounded-2xl flex flex-wrap gap-x-8 gap-y-3 items-center justify-between shadow-md mb-8 font-mono">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">RADAR OPERATORS:</span>
                <span className="text-[11px] font-black text-cyan-400">{onlineCount}</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_#8b5cf6]" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">INJECTORS LOADED:</span>
                <span className="text-[11px] font-black text-indigo-400">{terminalFeatures.length}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">GATEWAY STATUS:</span>
                <span className="text-[11px] font-black text-emerald-400">STABLE CORE</span>
              </div>
            </div>

            {/* DUAL MAIN AREA */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left col */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Search Section */}
                <div className="bg-[#070b13]/90 border border-[#22d3ee]/15 p-4 rounded-2xl flex flex-col gap-4 shadow-xl">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cyan-500/50" />
                    <input 
                      type="text" 
                      placeholder="Intercept and search telemetry mod injectors..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl py-3 pl-11 pr-10 text-xs font-mono tracking-wider text-cyan-300 outline-none transition uppercase"
                    />
                    {searchInput && (
                      <button 
                        onClick={() => {
                          setSearchInput("");
                          setTerminalSearchQuery("");
                          SoundCore.playTick();
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-slate-900 text-slate-500 hover:text-rose-400 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button 
                      onClick={() => {
                        setTerminalCategory("ALL");
                        SoundCore.playTick();
                      }}
                      className={`px-3 py-2 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase transition shrink-0 cursor-pointer ${
                        terminalCategory === "ALL" 
                          ? "btn-gold-flash font-black text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300 scale-[1.02]" 
                          : "bg-[#04070e] border border-slate-900 text-slate-400 hover:text-amber-400 hover:border-amber-500/50"
                      }`}
                    >
                      ALL DEPLOYED INFRASTRUCTURE
                    </button>
                    {["Aim Mods", "Sensors", "Bypass", "Security"].map((cat) => (
                      <button 
                        key={cat}
                        onClick={() => {
                          setTerminalCategory(cat);
                          SoundCore.playTick();
                        }}
                        className={`px-3 py-2 rounded-lg text-[9px] font-mono font-bold tracking-wider uppercase transition shrink-0 cursor-pointer ${
                          terminalCategory === cat 
                            ? "btn-gold-flash font-black text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300 scale-[1.02]" 
                            : "bg-[#04070e] border border-slate-900 text-slate-400 hover:text-amber-400 hover:border-amber-500/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid List */}
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  {isSyncing ? (
                    [1, 2, 3, 4, 5, 6].map((num) => (
                      <div 
                        key={`scan-slot-${num}`}
                        className="premium-gold-box p-3 sm:p-4 rounded-3xl flex flex-col justify-between text-left relative overflow-hidden border border-amber-500/45 shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse"
                      >
                        {/* High-tech scanning laser and grid backdrop inside the square block */}
                        <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 mb-3 border border-amber-500/35 flex flex-col items-center justify-center">
                          {/* Moving scanning laser line */}
                          <div className="absolute inset-x-0 h-[2.5px] bg-amber-400 shadow-[0_0_12px_#fbbf24] z-10 animate-scan-fast" />
                          
                          {/* Tech Grid pattern */}
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12)_1px,transparent_1px)] bg-[size:5px_5px] opacity-80" />
                          
                          {/* Scanner indicator */}
                          <div className="relative z-20 flex flex-col items-center gap-1.5 p-2 text-center select-none font-mono">
                            <Cpu className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 animate-spin" style={{ animationDuration: "2.5s" }} />
                            <span className="text-[7px] sm:text-[8px] text-amber-300 tracking-[0.25em] font-black uppercase mt-1.5 animate-pulse">
                              DECRYPTING_NODE_{num}
                            </span>
                            <span className="text-[6px] sm:text-[7px] text-amber-500/60 tracking-widest uppercase">
                              PORT_SYNC_ACTIVE
                            </span>
                          </div>
                        </div>

                        {/* Text and details loading status bars */}
                        <div className="space-y-2 font-mono flex-1">
                          <div className="h-3.5 bg-amber-500/10 border border-amber-500/20 rounded w-4/5 animate-pulse" />
                          <div className="h-2 bg-slate-900 rounded w-11/12" />
                          <div className="h-2 bg-slate-900 rounded w-2/3" />
                        </div>

                        {/* Interactive simulation action controls */}
                        <div className="mt-4 pt-2 border-t border-slate-900/60 flex gap-2 font-mono">
                          <div className="flex-1 h-7.5 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-center justify-center text-[7.5px] sm:text-[8.5px] text-amber-500/60 font-black uppercase tracking-widest">
                            SYS_SYNC...
                          </div>
                          <div className="flex-1 h-7.5 rounded-lg bg-[#04070e] border border-slate-900 flex items-center justify-center text-[7.5px] sm:text-[8.5px] text-slate-700 font-bold uppercase tracking-widest">
                            WAIT
                          </div>
                        </div>
                      </div>
                    ))
                  ) : filteredTools.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-950/40 border border-[#22d3ee]/10 rounded-3xl p-8 backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
                      <div className="w-14 h-14 rounded-full bg-rose-500/5 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500/70 animate-pulse">
                        <ShieldAlert className="w-7 h-7" />
                      </div>
                      <h4 className="text-sm font-extrabold font-mono text-slate-300 uppercase tracking-widest">
                        NO DATA FOUND
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                        No active injectors or features matched your query "{terminalSearchQuery || searchInput}".
                      </p>
                      
                      <div className="flex gap-3 mt-6">
                        <button 
                          onClick={() => {
                            setSearchInput("");
                            setTerminalSearchQuery("");
                            SoundCore.playTick();
                          }} 
                          className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Clear Search
                        </button>
                        <button 
                          onClick={handleRefreshBypasses} 
                          className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded-xl text-[9px] font-mono font-black uppercase tracking-wider transition cursor-pointer"
                        >
                          Refresh HUD
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredTools.map((item) => {
                      let neonClass = "neon-card-cyan";
                      let activeBorderGlow = "border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/30";
                      let btn1Class = "btn-gold-flash font-black text-slate-950 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]";
                      let btn2Class = "bg-[#04070e] hover:bg-slate-900 text-amber-300 hover:text-amber-200 border border-amber-500/35 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-[1.02] duration-300";
                      
                      if (item.category === "Security") {
                        neonClass = "neon-card-gold";
                        activeBorderGlow = "border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.7)] ring-2 ring-amber-400/40";
                      } else if (item.category === "Aim Mods") {
                        neonClass = "neon-card-pink";
                        activeBorderGlow = "border-pink-500 shadow-[0_0_35px_rgba(236,72,153,0.7)] ring-2 ring-pink-500/40";
                      } else if (item.category === "Sensors") {
                        neonClass = "neon-card-green";
                        activeBorderGlow = "border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.7)] ring-2 ring-emerald-400/40";
                      }
 
                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            SoundCore.playTick();
                            setSelectedTool(item);
                          }}
                          className={`${neonClass} group p-2.5 sm:p-4 flex flex-col justify-between text-left cursor-pointer transition-all duration-300 ${
                            selectedTool?.id === item.id ? `scale-[1.02] ${activeBorderGlow}` : ""
                          }`}
                        >
                          <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 mb-2 sm:mb-3.5 border border-slate-900 pointer-events-none">
                            <img 
                              src={item.img} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300&auto=format&fit=crop";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                            
                            <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 text-[7px] sm:text-[8px] font-mono font-extrabold px-1 sm:px-1.5 py-0.5 rounded tracking-widest bg-emerald-500/90 text-slate-950 uppercase shadow-md font-mono">
                              {item.status || "ACTIVE"}
                            </span>
                            <span className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 text-[7px] sm:text-[8px] font-mono font-extrabold uppercase bg-slate-950/80 text-sky-400 border border-slate-800/60 px-1 sm:px-1.5 py-0.5 rounded tracking-widest shadow-md font-mono">
                              {item.category || "Mods"}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-extrabold text-[10px] sm:text-xs tracking-wide text-slate-100 uppercase group-hover:text-cyan-400 transition-colors font-mono truncate">
                                {item.name}
                              </h4>
                              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed font-mono">
                                {item.description}
                              </p>
                            </div>
                            
                            <div className="mt-2.5 sm:mt-4 pt-2 border-t border-slate-900/40 flex gap-1.5">
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  SoundCore.playSuccessLaser();
                                }}
                                className={`flex-1 text-[7px] sm:text-[8.5px] font-mono font-black uppercase text-center py-1.5 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-0.5 sm:gap-1 px-1 text-decoration-none shadow-md ${btn1Class}`}
                              >
                                <span>LAUNCH</span>
                                <ExternalLink className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              </a>
                              <a 
                                href="https://whatsapp.com/channel/0029Vb7f4Wd7DAWv9jU7zW0m" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  SoundCore.playBeep();
                                }}
                                className={`flex-1 text-[7px] sm:text-[8.5px] font-mono font-black uppercase text-center py-1.5 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-0.5 sm:gap-1 px-1 text-decoration-none shadow-md ${btn2Class}`}
                              >
                                <span>VIP GROUP</span>
                                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right col */}
              <div className="lg:col-span-4 lg:sticky lg:top-6 flex flex-col gap-6">
                <div className="bg-[#070b13]/90 border-2 border-cyan-500/30 p-6 rounded-3xl flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden text-left">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/[0.04] rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-5 relative z-10 font-mono">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-cyan-400 animate-pulse" />
                      <h3 className="font-cyber text-xs font-black text-white tracking-widest uppercase font-sans">
                        OWNER CONSOLE PROFILE
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[7px] text-cyan-400 font-extrabold tracking-widest uppercase animate-pulse">
                      ONLINE
                    </span>
                  </div>

                  <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 shadow-2xl group relative z-10">
                    <img 
                      src={stylishBoyImg} 
                      className="w-full h-full object-cover transition-all duration-700 hover:scale-105" 
                      alt="✬𐇽𝐌𝆊𐇽𝐊⃭⃭𝆊𝐌𝆊𐇽𝐊𝆊𐇽𝝧𝆊𐇽𝐃𝆊𐇽𝐙✭"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 px-3 py-1 bg-slate-950/80 border border-cyan-500/30 rounded-lg text-[8px] font-mono text-cyan-400 font-black uppercase tracking-wider backdrop-blur-sm">
                      SYS_ROLE: OVERLORD
                    </div>

                    <motion.div 
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-[1.5px] bg-cyan-400 shadow-[0_0_10px_#22d3ee] pointer-events-none"
                    />
                  </div>

                  <div className="mt-5 space-y-4 relative z-10">
                    <div className="font-mono">
                      <div className="text-[7.5px] text-slate-500 tracking-wider uppercase">
                        Operator Code signature
                      </div>
                      <h4 className="font-cyber text-lg font-black text-white uppercase tracking-wider mt-1 flex items-center gap-2 font-sans">
                        ✬𐇽𝐌𝆊𐇽𝐊⃭⃭𝆊𝐌𝆊𐇽𝐊𝆊𐇽𝝧𝆊𐇽𝐃𝆊𐇽𝐙✭ 👑
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900/60 text-left font-mono">
                      <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                        <span className="text-[7px] text-slate-500 uppercase block">SYSTEM DESIGNER</span>
                        <span className="text-[10px] font-bold text-cyan-300 uppercase block mt-1">UMAR MALANG</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                        <span className="text-[7px] text-slate-500 uppercase block">CONSOLE CLEARANCE</span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase block mt-1">MK-6720 ELITE</span>
                      </div>
                      <div className="p-2.5 bg-[#03060a] border border-slate-900 rounded-xl col-span-2 text-center py-3">
                        <span className="text-[7px] text-slate-400 uppercase block tracking-wider">OFFICIAL WEBSITE OWNER</span>
                        <span className="text-[10.5px] font-extrabold text-[#ffd700] uppercase block mt-1">✬𐇽𝐌𝆊𐇽𝐊⃭⃭𝆊𝐌𝆊𐇽𝐊𝆊𐇽𝝧𝆊𐇽𝐃𝆊𐇽𝐙✭ DIRECT LINE</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-900/60 flex flex-col gap-2.5 font-mono">
                      <a 
                        href="https://whatsapp.com/channel/0029Vb7f4Wd7DAWv9jU7zW0m" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => SoundCore.playSuccessLaser()}
                        className="w-full text-[10px] font-black uppercase text-center py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-decoration-none shadow-md btn-gold-3d cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>JOIN OFFICIAL CHANNEL</span>
                      </a>
                      <a 
                        href="https://wa.me/923327011312" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => SoundCore.playBeep()}
                        className="w-full text-[10px] font-black uppercase text-center py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-decoration-none shadow-md btn-cyan-3d cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>CONTACT CHIEF OPERATOR</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== BOTTOM FOOTER ==================== */}
      {!showSplash && isLoggedIn && (
        <footer className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-900 text-center text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row justify-between items-center gap-4 z-10 relative pb-10">
          <p>© 2026 MKMODZ CONSOLE. All real-time telemetry pipelines decrypted cleanly.</p>
          <div className="flex gap-4">
            <span className="text-cyan-500 font-bold">100% END-TO-END SECURE</span>
            <span className="text-slate-800">|</span>
            <span className="text-[#ffd700] font-bold">STABLE RECON ENGINE ACTIVE</span>
          </div>
        </footer>
      )}

      {/* ==================== MASTER BACKDROP OVERLAY ==================== */}
      <AnimatePresence>
        {(showSideDrawer || showProfileDrawer || showAdminDrawer) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowSideDrawer(false);
              setShowProfileDrawer(false);
              setShowAdminDrawer(false);
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* ==================== DRAWERS ==================== */}

      {/* 2.5 NOTIFICATIONS FEED DRAWER */}
      <AnimatePresence>
        {showNotificationsDrawer && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-3 bottom-3 right-3 max-w-sm w-5/6 bg-[#090e17]/98 border border-[#22d3ee]/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] z-[9999] p-6 flex flex-col justify-between backdrop-blur-2xl rounded-3xl font-mono text-left"
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/60 mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h2 className="font-extrabold tracking-widest text-[#22D3EE] uppercase text-sm">NOTIFICATIONS FEED</h2>
                </div>
                <button 
                  onClick={() => {
                    SoundCore.playTick();
                    setShowNotificationsDrawer(false);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">
                  {notifications.length} TRANSMISSION{notifications.length !== 1 ? "S" : ""}
                </span>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        SoundCore.playTick();
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      }}
                      className="text-[8.5px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                    >
                      Mark All Read
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      onClick={() => {
                        SoundCore.playTick();
                        setNotifications([]);
                      }}
                      className="text-[8.5px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider"
                    >
                      Wipe All
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 scrollbar-none">
                {notifications.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3.5 bg-slate-950/40 border border-dashed border-slate-800/60 rounded-2xl">
                    <BellRing className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NO DIRECTORY ALERTS</h4>
                      <p className="text-[8.5px] text-slate-600 uppercase mt-1 leading-relaxed">
                        Standby mode active. New features uploaded from the admin panel will instantly flash here in real-time.
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        SoundCore.playTick();
                        // Mark as read
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                        // Locate tool
                        const targetTool = terminalFeatures.find(t => t.id === notif.id.split("-")[0]);
                        if (targetTool) {
                          setSelectedTool(targetTool);
                          triggerToast(`Navigating to ${targetTool.name}...`, "info");
                          setShowNotificationsDrawer(false);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer relative group flex flex-col gap-1.5 ${
                        notif.read 
                          ? "bg-slate-950/40 border-slate-900/60 hover:bg-slate-900/40 hover:border-slate-800" 
                          : "bg-cyan-950/20 border-cyan-500/25 hover:bg-cyan-950/30 hover:border-cyan-500/45 shadow-[0_0_12px_rgba(6,182,212,0.05)]"
                      }`}
                    >
                      {!notif.read && (
                        <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                          notif.category === "Aim Mods" 
                            ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                            : notif.category === "Sensors"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : notif.category === "Security"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}>
                          {notif.category || "Bypass"}
                        </span>
                        <span className="text-[8px] text-slate-500 font-bold font-mono ml-auto">
                          {notif.time}
                        </span>
                      </div>
                      <h4 className="text-[10.5px] font-black text-slate-200 group-hover:text-cyan-300 transition uppercase tracking-wide">
                        {notif.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 uppercase leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900/60 mt-4">
              <button
                onClick={() => {
                  SoundCore.playTick();
                  setShowNotificationsDrawer(false);
                }}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-300 font-bold tracking-widest text-[10px] uppercase rounded-xl transition text-center cursor-pointer"
              >
                DISMISS FEED
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. SIDE OPTIONS MENU DRAWER */}
      <AnimatePresence>
        {showSideDrawer && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-3 bottom-3 right-3 max-w-sm w-5/6 bg-[#090e17]/95 border border-[#22d3ee]/15 shadow-2xl z-[9999] p-6 flex flex-col justify-between backdrop-blur-2xl rounded-3xl overflow-y-auto scrollbar-none font-mono"
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/60 mb-6">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                  <h2 className="font-extrabold tracking-widest text-[#22D3EE] uppercase text-sm">CONSOLE LINK MENU</h2>
                </div>
                <button 
                  onClick={() => {
                    SoundCore.playTick();
                    setShowSideDrawer(false);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <a 
                  href="https://whatsapp.com/channel/0029Vb7f4Wd7DAWv9jU7zW0m" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => SoundCore.playTick()}
                  className="flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-[#10b981]/30 rounded-xl transition group text-decoration-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#10b981]/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black tracking-wider text-slate-200 group-hover:text-green-400">Follow WHATSAPP</h4>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5">Official Bypass Channel</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                </a>

                <a 
                  href="https://wa.me/+923307499677" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => SoundCore.playTick()}
                  className="flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-blue-500/30 rounded-xl transition group text-decoration-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#3b82f6]/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black tracking-wider text-slate-200 group-hover:text-blue-400">Contact Admin</h4>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5">Bypass Assistance Desk</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                </a>

                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    SoundCore.playTick();
                    setShowSideDrawer(false);
                    setShowProfileDrawer(true);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-indigo-500/30 rounded-xl cursor-pointer transition group text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black tracking-wider text-slate-200 group-hover:text-indigo-400">Customize Profile</h4>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5">Edit Name & Avatar</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition shrink-0" />
                </button>

                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAdminWithPasscode();
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-cyan-500/30 rounded-xl cursor-pointer transition group text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black tracking-wider text-slate-200 group-hover:text-cyan-400">Command Panel</h4>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5">Bypass Telemetry Injector</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition shrink-0" />
                </button>

                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    SoundCore.playTick();
                    setShowSideDrawer(false);
                    setShowWelcomeBriefing(true);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 hover:border-sky-500/30 rounded-xl cursor-pointer transition group text-left outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black tracking-wider text-slate-200 group-hover:text-sky-400">Welcome Briefing</h4>
                      <p className="text-[9px] text-slate-500 uppercase mt-0.5">Core System Rules</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition shrink-0" />
                </button>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 bg-rose-950/25 hover:bg-rose-950/45 border border-rose-900/40 hover:border-rose-500 text-rose-400 rounded-xl transition cursor-pointer font-bold tracking-widest text-xs uppercase"
            >
              <LogOut className="w-4 h-4" />
              <span>Deauthorize Session</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PROFILE CUSTOMIZER DRAWER */}
      <AnimatePresence>
        {showProfileDrawer && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-3 bottom-3 right-3 max-w-sm w-5/6 bg-[#090e17]/95 border border-[#22d3ee]/15 shadow-2xl z-[9999] p-6 flex flex-col justify-between backdrop-blur-2xl text-left rounded-3xl overflow-y-auto scrollbar-none font-mono"
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/60 mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
                  <h2 className="font-extrabold tracking-widest text-[#22D3EE] uppercase text-sm">PROFILE MANAGER</h2>
                </div>
                <button 
                  onClick={() => {
                    SoundCore.playTick();
                    setShowProfileDrawer(false);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 pt-2">
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full border-2 border-indigo-500/40 p-1 mb-3 bg-slate-900 overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <img 
                      src={customBase64 || userData.pfp} 
                      className="w-full h-full object-cover rounded-full" 
                      alt="Avatar Preview"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      SoundCore.playTick();
                      document.getElementById("pfp-file-picker")?.click();
                    }}
                    className="px-4 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-lg text-[9px] tracking-widest text-slate-400 uppercase flex items-center gap-1.5 transition cursor-pointer font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>UPLOAD AVATAR IMAGE</span>
                  </button>
                  <input 
                    type="file" 
                    id="pfp-file-picker" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={previewPfpFile}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-500 tracking-wider mb-2 font-bold ml-1">
                    COMMUNICATION HANDLE (NAME)
                  </label>
                  <input 
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder={userData.name}
                    className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 text-slate-100 rounded-xl p-3.5 outline-none text-xs font-semibold transition uppercase"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={saveProfileData}
              className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold tracking-widest text-xs uppercase rounded-xl transition shadow-lg cursor-pointer"
            >
              COMMIT SYSTEM CHANGES
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ADMIN COMMAND DRAWER */}
      <AnimatePresence>
        {showAdminDrawer && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-3 bottom-3 right-3 max-w-sm w-5/6 bg-[#090e17]/95 border border-[#22d3ee]/15 shadow-2xl z-[9999] p-6 flex flex-col justify-between backdrop-blur-2xl text-left rounded-3xl overflow-y-auto scrollbar-none font-mono"
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-slate-800/60 mb-6">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#22d3ee]" />
                  <h2 className="font-extrabold tracking-widest text-[#22D3EE] uppercase text-sm">TELEMETRY INJECTOR</h2>
                </div>
                <button 
                  onClick={() => {
                    SoundCore.playTick();
                    setShowAdminDrawer(false);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="h-[calc(100vh-220px)] overflow-y-auto pr-1 space-y-5 scrollbar-none">
                <div className="bg-blue-950/15 border border-blue-900/30 rounded-xl p-3.5 text-[10px] text-blue-300 leading-relaxed font-bold">
                  <span className="font-black text-blue-400 uppercase tracking-widest block mb-1">COMMAND PROTOCOL</span>
                  Compile and load custom injector signatures dynamically directly onto the real-time HUD and synchronize database.
                </div>

                <div className="bg-slate-900/30 border border-slate-800/70 rounded-xl p-4">
                  <span className="text-[9px] uppercase text-slate-500 tracking-wider block mb-2 font-bold">DATABASE SYNCHRONIZATION</span>
                  <button 
                    onClick={handleRefreshBypasses}
                    className="w-full py-3 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-900/40 text-cyan-400 font-bold tracking-widest text-[9px] uppercase rounded-lg transition text-center cursor-pointer"
                  >
                    RE-SYNC HUD DIRECTORY
                  </button>
                </div>

                <div className="bg-slate-900/30 border border-slate-800/70 rounded-xl p-4">
                  <span className="text-[9px] uppercase text-slate-400 tracking-wider block mb-2.5 font-bold border-b border-slate-800 pb-1.5 ml-1">
                    ACTIVE TELEMETRY INJECTORS
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {terminalFeatures.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-slate-950/90 border border-slate-900 rounded-lg gap-2 text-left">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-200 truncate uppercase tracking-widest font-mono">
                            {item.name}
                          </p>
                          <p className="text-[8px] text-slate-500 uppercase font-mono mt-0.5">
                            {item.category || "Bypass"}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteMod(item.id)}
                          className="w-7 h-7 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/30 hover:border-rose-500 text-rose-400 rounded flex items-center justify-center transition shrink-0 cursor-pointer" 
                          title="Delete injector"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleDeployCustomMod} className="space-y-4">
                  <span className="text-[9px] uppercase text-slate-400 tracking-wider block mb-1 font-bold border-b border-slate-800 pb-1.5 ml-1">
                    COMPILE NEW BYPASS PAYLOAD
                  </span>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                      Mod Brand/Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={newToolName}
                      onChange={(e) => setNewToolName(e.target.value)}
                      placeholder="e.g. CapCut Pro Premium"
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-xs text-cyan-300 outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                      Payload Launch URL *
                    </label>
                    <input 
                      type="url" 
                      required
                      value={newToolLink}
                      onChange={(e) => setNewToolLink(e.target.value)}
                      placeholder="https://whatsapp.com/channel/..."
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-xs text-cyan-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                      Mod Icon Image URL (Optional)
                    </label>
                    <input 
                      type="url" 
                      value={newToolImg}
                      onChange={(e) => setNewToolImg(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-xs text-cyan-300 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                      Classification Category
                    </label>
                    <select 
                      value={newToolCat}
                      onChange={(e) => setNewToolCat(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-xs text-cyan-300 outline-none cursor-pointer"
                    >
                      <option value="Aim Mods">Aim Mods</option>
                      <option value="Sensors">Sensors</option>
                      <option value="Bypass">Bypass</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5 ml-1">
                      Bypass Description
                    </label>
                    <textarea 
                      rows={2}
                      value={newToolDesc}
                      onChange={(e) => setNewToolDesc(e.target.value)}
                      placeholder="Input custom bypass descriptive guidelines..."
                      className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-xs text-cyan-300 outline-none resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs tracking-widest rounded-xl transition shadow-lg cursor-pointer uppercase active:scale-95"
                  >
                    COMPILE & DEPLOY SIGNATURE
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODERN WELCOME BRIEFING DIALOG OVERLAY */}
      <AnimatePresence>
        {showWelcomeBriefing && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 [perspective:1500px]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 60, rotateX: 20, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 6, rotateY: -3 }}
              exit={{ opacity: 0, scale: 0.8, y: 60, rotateX: 20, rotateY: -15 }}
              whileHover={{ rotateX: 1, rotateY: 3, scale: 1.01 }}
              transition={{ type: "spring", damping: 22, stiffness: 140 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-full max-w-md bg-gradient-to-b from-[#0d172e] to-[#03060c] border-2 border-cyan-500/50 rounded-[24px] p-5 md:p-6 shadow-[-25px_35px_80px_rgba(0,0,0,0.95),0_0_90px_rgba(6,182,212,0.3)] backdrop-blur-md overflow-hidden text-left transform-gpu cursor-default"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.025)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-[24px]" />
              
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400 pointer-events-none rounded-tl-[24px] opacity-80" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400 pointer-events-none rounded-tr-[24px] opacity-80" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400 pointer-events-none rounded-bl-[24px] opacity-80" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400 pointer-events-none rounded-br-[24px] opacity-80" />

              <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-cyan-400/20 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div style={{ transform: "translateZ(55px)" }} className="flex flex-row justify-between items-center border-b border-slate-900/90 pb-3 mb-4 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/5 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                    <ShieldCheck className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-cyber text-sm font-black text-emerald-400 uppercase tracking-widest leading-none drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                      BYPASS GRANTED
                    </h2>
                    <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest mt-1 font-bold">
                      OPERATOR STANDARDS ACTIVE
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[8.5px] text-[#ffd700] font-black bg-[#ffd700]/5 border border-[#ffd700]/30 px-2.5 py-1.5 rounded-lg shadow-[0_4px_15px_rgba(0,0,0,0.6)]">
                    {terminalClock} UTC
                  </span>
                </div>
              </div>

              <div 
                style={{ transform: "translateZ(35px)" }} 
                className="bg-[#02050a] border border-slate-900/90 rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-3 text-[11px] font-mono shadow-[inset_0_2px_8px_rgba(0,0,0,0.9),0_4px_8px_rgba(0,0,0,0.5)]"
              >
                <div>
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-black">IDENTITY:</span>
                  <span className="text-[10px] text-slate-200 font-black uppercase mt-0.5 block truncate">
                    {userData.name}
                  </span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-black">CLEARANCE:</span>
                  <span className="text-[10px] text-cyan-400 font-black uppercase mt-0.5 block">
                    SEC-LEVEL-MAX
                  </span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-black">SECTOR CODE:</span>
                  <span className="text-[10px] text-indigo-400 font-black uppercase mt-0.5 block truncate">
                    {userData.userId}
                  </span>
                </div>
                <div>
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest block font-black">STATUS:</span>
                  <span className="text-[10px] text-emerald-400 font-black uppercase mt-0.5 block">
                    ONLINE SECURED
                  </span>
                </div>
              </div>

              <div style={{ transform: "translateZ(25px)" }} className="space-y-3 mb-5 font-mono">
                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5 shadow-md">
                    01
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">ZERO LATENCY DECRYPT ENGINE</h4>
                    <p className="text-[9.5px] text-slate-500 leading-relaxed mt-0.5">
                      Systems operate under high-speed persistent caching. Updates synchronize instantly in the background.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center text-[8px] font-black shrink-0 mt-0.5 shadow-md">
                    02
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">WHATSAPP CYBER UPDATES</h4>
                    <p className="text-[9.5px] text-slate-500 leading-relaxed mt-0.5">
                      Key signatures are rebuilt dynamically. Subscribe directly to get updated bypass builds.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ transform: "translateZ(45px)" }} className="flex flex-col gap-2.5 font-mono">
                <a 
                  href="https://whatsapp.com/channel/0029Vb7f4Wd7DAWv9jU7zW0m" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => SoundCore.playTick()}
                  className="flex items-center justify-between p-2.5 bg-emerald-950/20 hover:bg-emerald-950/35 border border-emerald-900/40 hover:border-emerald-500/60 rounded-lg transition group text-decoration-none shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block truncate">
                      JOIN WHATSAPP CHANNEL FOR UPDATES
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition" />
                </a>

                <button 
                  onClick={() => {
                    SoundCore.playTick();
                    sessionStorage.setItem("stand_seenBriefing", "true");
                    setShowWelcomeBriefing(false);
                  }}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black tracking-widest text-[10px] uppercase py-3 rounded-lg shadow-[0_8px_20px_-5px_rgba(6,182,212,0.45)] transition duration-200 cursor-pointer active:translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                    <span>AUTHORIZE & ENTER HUD</span>
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECURITY ACCESS PASSCODE DIALOG */}
      <AnimatePresence>
        {showPasscodeModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                SoundCore.playTick();
                setShowPasscodeModal(false);
              }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#070b13]/95 border-2 border-[#22d3ee]/25 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] relative z-10 text-center font-mono"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#22d3ee] to-transparent" />
              
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Key className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-cyber text-base font-black text-white tracking-widest uppercase font-sans">SECURE DECRYPT CONSOLE</h3>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">ADMIN SECURITY CLEARANCE REQUIRED</p>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 mb-5 flex flex-col items-center justify-center relative shadow-inner">
                <div className="text-cyan-400 text-lg font-bold tracking-widest min-h-7 flex items-center">
                  {passcodeInput ? (
                    <span className="text-xl tracking-[0.2em]">{passcodeInput.replace(/./g, "•")}</span>
                  ) : (
                    <span className="text-slate-700 text-xs tracking-wider uppercase">ENTER PASSCODE</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      SoundCore.playTick();
                      if (passcodeInput.length < 16) {
                        setPasscodeInput(prev => prev + num);
                      }
                    }}
                    className="py-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-400 rounded-xl font-black text-sm tracking-wider transition active:scale-95 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                
                <button
                  onClick={() => {
                    SoundCore.playBeep();
                    setPasscodeInput("");
                  }}
                  className="py-3 bg-rose-950/20 hover:bg-rose-950/45 border border-rose-900/45 hover:border-rose-500 text-rose-400 rounded-xl font-black text-xs tracking-wider transition active:scale-95 cursor-pointer"
                >
                  CLR
                </button>

                <button
                  onClick={() => {
                    SoundCore.playTick();
                    if (passcodeInput.length < 16) {
                      setPasscodeInput(prev => prev + "0");
                    }
                  }}
                  className="py-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-400 rounded-xl font-black text-sm tracking-wider transition active:scale-95 cursor-pointer"
                >
                  0
                </button>

                <button
                  onClick={() => {
                    const pin = passcodeInput;
                    if (pin === "3434" || pin === "admin123" || pin === "923327011312") {
                      SoundCore.playSuccessLaser();
                      setShowPasscodeModal(false);
                      setPasscodeInput("");
                      setShowAdminDrawer(true);
                      triggerToast("Admin authorization successful!", "success");
                    } else {
                      SoundCore.playBeep();
                      triggerToast("ACCESS DENIED: INVALID PASSCODE SIGNATURE", "error");
                      setPasscodeInput("");
                    }
                  }}
                  className="py-3 bg-cyan-950/20 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 rounded-xl font-black text-xs tracking-wider transition active:scale-95 cursor-pointer"
                >
                  OK
                </button>
              </div>

              <div className="mb-6 relative">
                <input 
                  type="password"
                  placeholder="Type passcode or key..."
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const pin = passcodeInput;
                      if (pin === "3434" || pin === "admin123" || pin === "923327011312") {
                        SoundCore.playSuccessLaser();
                        setShowPasscodeModal(false);
                        setPasscodeInput("");
                        setShowAdminDrawer(true);
                        triggerToast("Admin authorization successful!", "success");
                      } else {
                        SoundCore.playBeep();
                        triggerToast("ACCESS DENIED: INVALID PASSCODE SIGNATURE", "error");
                        setPasscodeInput("");
                      }
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-900 focus:border-cyan-500 rounded-xl py-2.5 px-4 text-center text-xs tracking-widest text-cyan-300 outline-none transition"
                />
              </div>

              <button
                onClick={() => {
                  SoundCore.playTick();
                  setShowPasscodeModal(false);
                }}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase rounded-xl tracking-widest transition"
              >
                CANCEL SECURE CHANNEL
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 30-SECOND DYNAMIC 3D HIGH-FIDELITY PROMO AD MODAL */}
      <AnimatePresence>
        {showPromoAd && (
          <div className="fixed inset-0 z-[100005] flex items-center justify-center p-4 [perspective:1200px]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                SoundCore.playTick();
                setShowPromoAd(false);
              }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 80, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 3, rotateY: -1 }}
              exit={{ opacity: 0, scale: 0.8, y: 80, rotateX: 20 }}
              transition={{ type: "spring", damping: 18, stiffness: 140 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative w-full max-w-md bg-gradient-to-b from-[#11192a] to-[#040810] border-2 border-amber-500/40 rounded-[32px] p-6 md:p-8 shadow-[-20px_35px_80px_rgba(0,0,0,0.95),0_0_80px_rgba(245,158,11,0.15)] backdrop-blur-md overflow-hidden text-center transform-gpu font-mono"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-[32px]" />
              <div className="absolute top-0 right-0 p-8 w-44 h-44 bg-gradient-to-br from-amber-500/15 to-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

              <button 
                onClick={() => {
                  SoundCore.playTick();
                  setShowPromoAd(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-950/85 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 flex items-center justify-center text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div style={{ transform: "translateZ(30px)" }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-full mb-5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                  SPECIAL SYSTEM PROMOTION
                </span>
              </div>

              <div style={{ transform: "translateZ(40px)" }} className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/25 to-orange-600/10 border border-amber-500/45 flex items-center justify-center text-amber-400 shadow-[0_8px_25px_rgba(245,158,11,0.25)] mb-6 animate-bounce">
                <Globe className="w-8 h-8" />
              </div>

              <h3 style={{ transform: "translateZ(30px)" }} className="font-cyber text-lg font-black text-white uppercase tracking-wider mb-3 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)] font-sans">
                BUILD YOUR BRAND ONLINE
              </h3>

              <p style={{ transform: "translateZ(20px)" }} className="text-sm text-slate-200 font-black leading-relaxed mb-8 px-2 uppercase tracking-wide">
                "Agr aap na apne name ke koye website banwane hon to neche diye gaye button par click Karein."
              </p>

              <div style={{ transform: "translateZ(25px)" }} className="space-y-3">
                <a 
                  href="https://wa.me/923307499677?text=Assalam-o-Alaikum%20MK-MODZ%2C%20I%20want%20to%20build%20a%20website%20on%20my%20name"
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => {
                    SoundCore.playSuccessLaser();
                    setShowPromoAd(false);
                  }}
                  className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-500 via-orange-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black tracking-widest text-xs uppercase py-4 rounded-xl shadow-[0_12px_25px_-5px_rgba(245,158,11,0.35),0_4px_12px_rgba(0,0,0,0.6)] transition duration-200 cursor-pointer flex items-center justify-center gap-2 text-decoration-none active:translate-y-0.5"
                >
                  <MessageSquare className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>GET CUSTOM WEBSITE NOW</span>
                </a>

                <button 
                  onClick={() => {
                    SoundCore.playTick();
                    setShowPromoAd(false);
                  }}
                  className="w-full py-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-300 text-[9px] font-black uppercase tracking-widest transition cursor-pointer"
                >
                  CONTINUE SEARCHING BYPASSES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
