import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { ArrowRight, Settings, Sparkles } from 'lucide-react';

interface LandingSettings {
  title: string;
  description: string;
  heroImage: string;
  ctaText: string;
  accessCode: string;
}

export default function LandingPage() {
  const { ebookId } = useParams<{ ebookId: string }>();
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ebookId) return;
    const unsub = onSnapshot(doc(db, 'ebooks', ebookId), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as LandingSettings);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [ebookId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050507]">
        <div className="w-10 h-10 border-2 border-[#00f3ff]/30 border-t-[#00f3ff] rounded-full animate-spin" />
      </div>
    );
  }

  const displaySettings = settings || {
    title: "The Untold Story",
    description: "Discover a journey through time and space. This is a placeholder description until the admin updates the content.",
    heroImage: "https://picsum.photos/seed/ebook/400/600",
    ctaText: "Get Started",
    accessCode: ""
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-[#050507]"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#00f3ff]/10 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#bc13fe]/10 blur-[120px] rounded-full pointer-events-none" 
      />

      {/* Admin Settings Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-8 right-8 z-50"
      >
        <Link 
          to="/admin" 
          className="p-3 glass-panel hover:bg-white/10 rounded-full text-zinc-400 hover:text-[#bc13fe] transition-all flex items-center justify-center group"
          title="Admin Dashboard"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
        </Link>
      </motion.div>

      {/* Fixed Top-Left Image (Thumbnail style) */}
      <motion.div 
        initial={{ x: -100, opacity: 0, rotateY: 20 }}
        animate={{ x: 0, opacity: 1, rotateY: 0 }}
        transition={{ delay: 0.2, duration: 1, type: "spring", bounce: 0.3 }}
        className="md:fixed top-8 left-8 md:w-80 w-full p-8 md:p-0 z-10 perspective-1000"
      >
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.15)] border border-white/10 group">
          {displaySettings.heroImage && (
            <img 
              src={displaySettings.heroImage} 
              alt="Cover" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-80" />
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-96 flex items-center p-8 md:p-16 lg:p-24 z-0">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-[#00f3ff]/30 text-[#00f3ff] text-xs font-mono tracking-widest uppercase mb-6"
          >
            <Sparkles className="w-3 h-3" />
            <span>Interactive Ebook</span>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring", bounce: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter text-white mb-8 leading-[1.1]"
          >
            {displaySettings.title}
          </motion.h1>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="prose prose-invert prose-lg text-zinc-400 mb-12"
          >
            <p className="leading-relaxed whitespace-pre-wrap text-lg md:text-xl font-light">
              {displaySettings.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link 
              to={`/ebook/${ebookId}/read`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] group"
            >
              <span className="font-display tracking-wide">{displaySettings.ctaText}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
