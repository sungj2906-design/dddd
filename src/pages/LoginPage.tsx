import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Lock, Settings } from 'lucide-react';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'ebooks'), where('accessCode', '==', code.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Invalid code');
      } else {
        const ebookDoc = querySnapshot.docs[0];
        navigate(`/ebook/${ebookDoc.id}/start`);
      }
    } catch (err) {
      console.error("Error checking code:", err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative">
      {/* Admin Settings Icon */}
      <Link 
        to="/admin" 
        className="absolute top-8 right-8 z-50 p-3 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md rounded-full border border-white/10 text-zinc-400 hover:text-white transition-all"
        title="Admin Dashboard"
      >
        <Settings className="w-5 h-5" />
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-serif text-white">Access Ebook</h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">
            Enter your access code to read the ebook.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Access Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code..."
                className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Enter Ebook'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
