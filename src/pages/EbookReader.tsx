import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Virtual } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Home, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/virtual';

interface EbookPage {
  id: string;
  pageNumber: number;
  images: string[];
  text?: string;
}

export default function EbookReader() {
  const { ebookId } = useParams<{ ebookId: string }>();
  const [pages, setPages] = useState<EbookPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ebookId) return;
    const q = query(collection(db, `ebooks/${ebookId}/pages`), orderBy('pageNumber', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedPages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          images: data.images || []
        } as EbookPage;
      });
      setPages(fetchedPages);
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

  if (pages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050507] text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
        <Sparkles className="w-12 h-12 text-[#bc13fe] mb-4 opacity-50" />
        <h2 className="text-2xl font-display mb-4">No pages found</h2>
        <p className="text-zinc-400 mb-8">This ebook doesn't have any content yet.</p>
        <Link 
          to={`/ebook/${ebookId}/start`}
          className="px-6 py-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors font-medium relative z-10"
        >
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#050507] text-white flex flex-col relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f3ff] to-[#bc13fe] opacity-50" />

      {/* Top Navigation */}
      <header className="flex items-center justify-between p-4 md:p-6 glass-panel border-b border-white/5 relative z-50">
        <Link 
          to={`/ebook/${ebookId}/start`} 
          className="flex items-center gap-2 text-zinc-400 hover:text-[#00f3ff] transition-colors group"
        >
          <Home className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          <span className="hidden sm:inline font-mono text-sm uppercase tracking-wider">Home</span>
        </Link>
        <div className="text-sm font-mono tracking-widest uppercase text-[#bc13fe]">
          Interactive Reader
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* Reader Engine */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden z-10">
        <Swiper
          modules={[Navigation, Pagination, Keyboard, Virtual]}
          spaceBetween={50}
          slidesPerView={1}
          navigation={{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom',
          }}
          pagination={{ type: 'fraction', el: '.swiper-pagination-custom' }}
          keyboard={{ enabled: true }}
          virtual
          className="w-full h-full max-w-7xl mx-auto"
        >
          {pages.map((page, index) => (
            <SwiperSlide key={page.id} virtualIndex={index}>
              <div className="flex flex-col md:flex-row items-center justify-center h-full p-6 md:p-12 lg:p-16 overflow-y-auto gap-8 md:gap-16 custom-scrollbar">
                
                {/* Text on the Left */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  {page.text ? (
                    <div className="prose prose-invert prose-lg md:prose-xl max-w-none">
                      <p className="leading-relaxed whitespace-pre-wrap font-light text-zinc-300">
                        {page.text}
                      </p>
                    </div>
                  ) : (
                    <div className="text-zinc-600 font-mono text-sm italic">[ No text content for this page ]</div>
                  )}
                </div>

                {/* Images on the Right */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <div className={`grid gap-6 ${
                    page.images.length === 1 ? 'grid-cols-1' :
                    page.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    page.images.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {page.images.map((img, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-panel neon-border group"
                      >
                        {img && (
                          <Zoom>
                            <img 
                              src={img} 
                              alt={`Page ${page.pageNumber} Image ${i + 1}`}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                          </Zoom>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </motion.div>
                    ))}
                  </div>
                </div>

              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Controls */}
        <button className="swiper-button-prev-custom absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 p-3 md:p-4 glass-panel hover:bg-white/10 rounded-full border border-[#00f3ff]/30 text-white transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button className="swiper-button-next-custom absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 p-3 md:p-4 glass-panel hover:bg-white/10 rounded-full border border-[#bc13fe]/30 text-white transition-all hover:scale-110 hover:shadow-[0_0_15px_rgba(188,19,254,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </main>

      {/* Footer Pagination */}
      <footer className="p-4 md:p-6 border-t border-white/5 flex justify-center items-center glass-panel relative z-50">
        <div className="swiper-pagination-custom text-sm font-mono tracking-widest text-zinc-400" />
      </footer>
    </motion.div>
  );
}
