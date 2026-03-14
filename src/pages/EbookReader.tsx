import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, Virtual } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
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
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">Loading pages...</div>;
  }

  if (pages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4">
        <p>No pages found. The admin needs to add some content.</p>
        <Link to={`/ebook/${ebookId}/start`} className="text-emerald-400 hover:underline">Return to Start</Link>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col"
    >
      {/* Top Navigation */}
      <header className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md z-50">
        <Link to={`/ebook/${ebookId}/start`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Home className="w-5 h-5 text-zinc-400" />
        </Link>
        <div className="text-sm font-medium tracking-widest uppercase text-zinc-500">
          Reader
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* Reader Engine */}
      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
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
              <div className="flex flex-col md:flex-row items-center justify-center h-full p-8 md:p-16 overflow-y-auto gap-8 md:gap-16">
                
                {/* Text on the Left */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  {page.text ? (
                    <div className="prose prose-invert prose-lg max-w-none text-zinc-300 font-serif leading-relaxed whitespace-pre-wrap">
                      {page.text}
                    </div>
                  ) : (
                    <div className="text-zinc-600 italic">No text for this page.</div>
                  )}
                </div>

                {/* Images on the Right */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <div className={`grid gap-4 ${
                    page.images.length === 1 ? 'grid-cols-1' :
                    page.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    page.images.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {page.images.map((img, i) => (
                      <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                        {img && (
                          <Zoom>
                            <img 
                              src={img} 
                              alt={`Page ${page.pageNumber} Image ${i + 1}`}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </Zoom>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom Navigation Controls */}
        <button className="swiper-button-prev-custom absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 p-4 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button className="swiper-button-next-custom absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 p-4 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-6 h-6" />
        </button>
      </main>

      {/* Footer Pagination */}
      <footer className="p-6 border-t border-white/5 flex justify-center items-center bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="swiper-pagination-custom text-sm font-mono tracking-widest text-zinc-500" />
      </footer>
    </motion.div>
  );
}
