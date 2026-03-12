import { useState, useEffect } from 'react';
import { db, storage, loginAdmin, auth } from '../firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Image as ImageIcon, Loader2, ArrowLeft, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LandingSettings {
  title: string;
  description: string;
  heroImage: string;
  ctaText: string;
}

interface EbookPage {
  id: string;
  pageNumber: number;
  images: string[];
  text?: string;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const [settings, setSettings] = useState<LandingSettings>({
    title: '',
    description: '',
    heroImage: '',
    ctaText: ''
  });
  const [pages, setPages] = useState<EbookPage[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Load Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'landing'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          title: data.title || '',
          description: data.description || '',
          heroImage: data.heroImage || '',
          ctaText: data.ctaText || ''
        });
      }
    });

    // Load Pages
    const q = query(collection(db, 'pages'), orderBy('pageNumber', 'asc'));
    const unsubPages = onSnapshot(q, (snapshot) => {
      setPages(snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          images: data.images || []
        } as EbookPage;
      }));
    });

    return () => {
      unsubSettings();
      unsubPages();
    };
  }, [isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await loginAdmin(secretCode);
      if (success) {
        setIsAdmin(true);
        setLoginError('');
      } else {
        setLoginError('Invalid access code');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'landing'), settings);
      alert('Settings saved successfully!');
    } catch (error: any) {
      console.error("Failed to save settings", error);
      alert(`Failed to save settings: ${error.message}`);
    }
    setSavingSettings(false);
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Image upload failed: ${error.message}`);
      throw error;
    }
  };

  const handleSettingsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await handleImageUpload(file);
      const newSettings = { ...settings, heroImage: url };
      setSettings(newSettings);
      await setDoc(doc(db, 'settings', 'landing'), newSettings);
    } catch (error) {
      console.error("Upload failed", error);
    }
    setUploadingImage(false);
  };

  const handleAddPage = async () => {
    const newPageNumber = pages.length > 0 ? Math.max(...pages.map(p => p.pageNumber)) + 1 : 1;
    await addDoc(collection(db, 'pages'), {
      pageNumber: newPageNumber,
      images: [],
      text: ''
    });
  };

  const handleDeletePage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      await deleteDoc(doc(db, 'pages', id));
    }
  };

  const handleUpdatePage = async (id: string, data: Partial<EbookPage>) => {
    try {
      await updateDoc(doc(db, 'pages', id), data);
    } catch (error: any) {
      console.error("Failed to update page", error);
      alert(`Failed to update page: ${error.message}`);
    }
  };

  const handlePageImageUpload = async (id: string, currentImages: string[], e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Simple loading state per page could be added, but global is fine for prototype
    setUploadingImage(true);
    try {
      const newUrls = await Promise.all(Array.from(files).map(f => handleImageUpload(f)));
      await handleUpdatePage(id, { images: [...(currentImages || []), ...newUrls] });
    } catch (error) {
      console.error("Upload failed", error);
    }
    setUploadingImage(false);
  };

  const handleRemovePageImage = async (id: string, currentImages: string[], indexToRemove: number) => {
    const newImages = (currentImages || []).filter((_, i) => i !== indexToRemove);
    await handleUpdatePage(id, { images: newImages });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="bg-zinc-900 p-8 rounded-2xl border border-white/10 w-full max-w-md"
        >
          <h2 className="text-2xl font-serif text-white mb-6">Admin Access</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Access Code</label>
              <input 
                type="password" 
                value={secretCode}
                onChange={e => setSecretCode(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter secret code..."
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button 
              type="submit"
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Enter Dashboard
            </button>
          </div>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-serif text-white">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Manage your landing page and ebook content</p>
          </div>
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Site
          </Link>
        </header>

        {/* Landing Page Settings */}
        <section className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Landing Page Settings</h2>
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                <input 
                  type="text" 
                  value={settings.title}
                  onChange={e => setSettings({...settings, title: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                <textarea 
                  value={settings.description}
                  onChange={e => setSettings({...settings, description: e.target.value})}
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">CTA Text</label>
                <input 
                  type="text" 
                  value={settings.ctaText}
                  onChange={e => setSettings({...settings, ctaText: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Hero Image</label>
              <div className="relative aspect-[3/4] bg-black border border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center group mb-3">
                {settings.heroImage ? (
                  <>
                    <img src={settings.heroImage} alt="Hero" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Change Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleSettingsImageUpload} disabled={uploadingImage} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 text-zinc-500 hover:text-white transition-colors">
                    {uploadingImage ? <Loader2 className="w-8 h-8 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                    <span>Upload Hero Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleSettingsImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Or paste image URL here..."
                  value={settings.heroImage}
                  onChange={e => setSettings({...settings, heroImage: e.target.value})}
                  className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ebook Pages Manager */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white">Ebook Pages</h2>
            <button 
              onClick={handleAddPage}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" /> Add Page
            </button>
          </div>

          <div className="space-y-6">
            {pages.map((page, index) => (
              <motion.div 
                key={page.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Page</span>
                      <input 
                        type="number" 
                        value={page.pageNumber}
                        onChange={e => handleUpdatePage(page.id, { pageNumber: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-black border border-white/10 rounded-lg px-3 py-1 text-white text-center focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePage(page.id)}
                    className="text-red-400/50 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Images Manager */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3 flex items-center justify-between">
                      Images
                      <label className="cursor-pointer text-emerald-400 hover:text-emerald-300 text-xs flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Image
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePageImageUpload(page.id, page.images, e)} />
                      </label>
                    </label>
                    
                    <div className="flex gap-2 mb-3">
                      <input 
                        type="text" 
                        placeholder="Or paste image URL and press Enter..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const url = e.currentTarget.value;
                            if (url) {
                              handleUpdatePage(page.id, { images: [...(page.images || []), url] });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    
                    {page.images.length === 0 ? (
                      <div className="h-32 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-zinc-600 text-sm">
                        No images added
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {page.images.map((img, i) => (
                          <div key={i} className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                            {img && <img src={img} alt="" className="w-full h-full object-cover opacity-80" />}
                            <button 
                              onClick={() => handleRemovePageImage(page.id, page.images, i)}
                              className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Manager */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3">Page Text (Optional)</label>
                    <textarea 
                      value={page.text || ''}
                      onChange={e => handleUpdatePage(page.id, { text: e.target.value })}
                      placeholder="Enter text for this page..."
                      rows={6}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none font-serif"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            
            {pages.length === 0 && (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                No pages yet. Click "Add Page" to start building your ebook.
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
