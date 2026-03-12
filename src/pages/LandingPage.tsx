import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { ArrowRight, Settings } from 'lucide-react';

interface LandingSettings {
  title: string;
  description: string;
  heroImage: string;
  ctaText: string;
}

export default function LandingPage() {
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'landing'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as LandingSettings);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Default fallback if no settings exist yet
  const displaySettings = settings || {
    title: "The Untold Story",
    description: "Discover a journey through time and space. This is a placeholder description until the admin updates the content.",
    heroImage: "https://picsum.photos/seed/ebook/400/600",
    ctaText: "Get Started"
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col md:flex-row relative overflow-hidden"
    >
      {/* Admin Settings Icon */}
      <Link 
        to="/admin" 
        className="absolute top-8 right-8 z-50 p-3 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md rounded-full border border-white/10 text-zinc-400 hover:text-white transition-all"
        title="Admin Dashboard"
      >
        <Settings className="w-5 h-5" />
      </Link>

      {/* Fixed Top-Left Image (Thumbnail style) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
        className="md:fixed top-8 left-8 md:w-64 w-full p-8 md:p-0 z-10"
      >
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
          {displaySettings.heroImage && (
            <img 
              src={displaySettings.heroImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-80 flex items-center p-8 md:p-16 lg:p-24 z-0">
        <div className="max-w-2xl">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-serif tracking-tight text-white mb-8"
          >
            {displaySettings.title}
          </motion.h1>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="prose prose-invert prose-lg text-zinc-400 mb-12"
          >
            <p className="leading-relaxed whitespace-pre-wrap">
              {displaySettings.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link 
              to="/ebook"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors group"
            >
              {displaySettings.ctaText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Atmospheric Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-500/10 blur-[120px] rounded-full" />
      </div>
    </motion.div>
  );
}
