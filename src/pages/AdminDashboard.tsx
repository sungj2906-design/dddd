import { useState, useEffect } from 'react';
import { db, storage, loginAdmin, auth } from '../firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Image as ImageIcon, Loader2, ArrowLeft, GripVertical, Book } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Ebook {
  id: string;
  title: string;
  description: string;
  heroImage: string;
  ctaText: string;
  accessCode: string;
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

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [selectedEbookId, setSelectedEbookId] = useState<string | null>(null);

  const [settings, setSettings] = useState<Omit<Ebook, 'id'>>({
    title: '',
    description: '',
    heroImage: '',
    ctaText: '',
    accessCode: ''
  });
  const [pages, setPages] = useState<EbookPage[]>([]);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAdmin(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubEbooks = onSnapshot(collection(db, 'ebooks'), (snapshot) => {
      setEbooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ebook)));
    });
    return () => unsubEbooks();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedEbookId) return;

    const unsubSettings = onSnapshot(doc(db, 'ebooks', selectedEbookId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Ebook, 'id'>;
        setSettings(data);
      }
    });

    const q = query(collection(db, `ebooks/${selectedEbookId}/pages`), orderBy('pageNumber', 'asc'));
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
  }, [isAdmin, selectedEbookId]);

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

  const handleCreateEbook = async () => {
    try {
      const docRef = await addDoc(collection(db, 'ebooks'), {
        title: 'New Ebook',
        description: 'Description goes here...',
        heroImage: '',
        ctaText: 'Read Now',
        accessCode: 'capcut_neonzsenpai'
      });
      setSelectedEbookId(docRef.id);
    } catch (error: any) {
      alert(`Failed to create ebook: ${error.message}`);
    }
  };

  const handleDeleteEbook = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ebook?')) {
      await deleteDoc(doc(db, 'ebooks', id));
      if (selectedEbookId === id) setSelectedEbookId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedEbookId) return;
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'ebooks', selectedEbookId), settings);
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
    if (!selectedEbookId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await handleImageUpload(file);
      const newSettings = { ...settings, heroImage: url };
      setSettings(newSettings);
      await setDoc(doc(db, 'ebooks', selectedEbookId), newSettings);
    } catch (error) {
      console.error("Upload failed", error);
    }
    setUploadingImage(false);
  };

  const handleAddPage = async () => {
    if (!selectedEbookId) return;
    const newPageNumber = pages.length > 0 ? Math.max(...pages.map(p => p.pageNumber)) + 1 : 1;
    await addDoc(collection(db, `ebooks/${selectedEbookId}/pages`), {
      pageNumber: newPageNumber,
      images: [],
      text: ''
    });
  };

  const handleDeletePage = async (id: string) => {
    if (!selectedEbookId) return;
    if (window.confirm('Are you sure you want to delete this page?')) {
      await deleteDoc(doc(db, `ebooks/${selectedEbookId}/pages`, id));
    }
  };

  const handleUpdatePageText = async (id: string, text: string) => {
    if (!selectedEbookId) return;
    await updateDoc(doc(db, `ebooks/${selectedEbookId}/pages`, id), { text });
  };

  const handleAddPageImage = async (pageId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEbookId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const url = await handleImageUpload(file);
      const page = pages.find(p => p.id === pageId);
      if (page) {
        const newImages = [...(page.images || []), url];
        await updateDoc(doc(db, `ebooks/${selectedEbookId}/pages`, pageId), { images: newImages });
      }
    } catch (error) {
      console.error("Failed to add image", error);
    }
  };

  const handleAddPageImageUrl = async (pageId: string, url: string) => {
    if (!selectedEbookId) return;
    if (!url.trim()) return;
    try {
      const page = pages.find(p => p.id === pageId);
      if (page) {
        const newImages = [...(page.images || []), url.trim()];
        await updateDoc(doc(db, `ebooks/${selectedEbookId}/pages`, pageId), { images: newImages });
      }
    } catch (error: any) {
      console.error("Failed to add image URL", error);
      alert(`Failed to add image URL: ${error.message}`);
    }
  };

  const handleRemovePageImage = async (pageId: string, imageIndex: number) => {
    if (!selectedEbookId) return;
    const page = pages.find(p => p.id === pageId);
    if (page) {
      const newImages = page.images.filter((_, i) => i !== imageIndex);
      await updateDoc(doc(db, `ebooks/${selectedEbookId}/pages`, pageId), { images: newImages });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8"
        >
          <h1 className="text-2xl font-serif text-white mb-6 text-center">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Admin Password</label>
              <input
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Enter admin password..."
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Enter Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!selectedEbookId) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-serif">Ebooks Dashboard</h1>
            <button
              onClick={handleCreateEbook}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Ebook
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ebooks.map(ebook => (
              <div key={ebook.id} className="bg-zinc-900 border border-white/10 rounded-xl p-6 flex flex-col">
                <div className="flex-1">
                  <h2 className="text-xl font-medium text-white mb-2">{ebook.title}</h2>
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{ebook.description}</p>
                  <div className="text-xs text-zinc-500 mb-4">
                    Access Code: <span className="font-mono text-emerald-400">{ebook.accessCode}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setSelectedEbookId(ebook.id)}
                    className="text-sm text-white hover:text-emerald-400 transition-colors"
                  >
                    Edit Ebook
                  </button>
                  <button
                    onClick={() => handleDeleteEbook(ebook.id)}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {ebooks.length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                No ebooks found. Create one to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-zinc-900 border border-white/10 p-4 md:p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedEbookId(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-serif">Editing: {settings.title}</h1>
              <p className="text-sm text-zinc-400">Manage settings and pages</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to={`/ebook/${selectedEbookId}/start`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              View Ebook
            </Link>
          </div>
        </div>

        {/* Global Settings */}
        <section className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Ebook Settings</h2>
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Ebook Title</label>
                <input 
                  type="text" 
                  value={settings.title}
                  onChange={e => setSettings({...settings, title: e.target.value})}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Description</label>
                <textarea 
                  value={settings.description}
                  onChange={e => setSettings({...settings, description: e.target.value})}
                  rows={4}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">CTA Button Text</label>
                <input 
                  type="text" 
                  value={settings.ctaText}
                  onChange={e => setSettings({...settings, ctaText: e.target.value})}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Access Code (Required to read)</label>
                <input 
                  type="text" 
                  value={settings.accessCode}
                  onChange={e => setSettings({...settings, accessCode: e.target.value})}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 font-mono text-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Hero Image</label>
              <div className="relative aspect-[3/4] w-full max-w-sm rounded-xl overflow-hidden border-2 border-dashed border-white/20 bg-zinc-950 group flex items-center justify-center">
                {settings.heroImage ? (
                  <>
                    <img src={settings.heroImage} alt="Hero" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-black/70 transition-colors">
                        Change Image
                        <input type="file" accept="image/*" className="hidden" onChange={handleSettingsImageUpload} disabled={uploadingImage} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center text-zinc-500 hover:text-zinc-300 transition-colors">
                    {uploadingImage ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <ImageIcon className="w-8 h-8 mb-2" />}
                    <span>Upload Hero Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleSettingsImageUpload} disabled={uploadingImage} />
                  </label>
                )}
              </div>
              <div className="mt-4">
                <label className="block text-xs text-zinc-500 mb-1">Or paste image URL:</label>
                <input 
                  type="text" 
                  value={settings.heroImage}
                  onChange={e => setSettings({...settings, heroImage: e.target.value})}
                  placeholder="https://..."
                  className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Pages Manager */}
        <section className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Pages</h2>
            <button 
              onClick={handleAddPage}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Page
            </button>
          </div>

          <div className="space-y-6">
            {pages.map((page, index) => (
              <div key={page.id} className="bg-zinc-950 border border-white/5 rounded-xl p-6 relative group">
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeletePage(page.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Page"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-mono text-sm text-zinc-400">
                    {page.pageNumber}
                  </div>
                  <h3 className="font-medium">Page Content</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Text Editor */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Page Text (Optional)</label>
                    <textarea 
                      value={page.text || ''}
                      onChange={e => handleUpdatePageText(page.id, e.target.value)}
                      placeholder="Write your story here..."
                      rows={8}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 resize-none font-serif leading-relaxed"
                    />
                  </div>

                  {/* Images Manager */}
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Page Images</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {page.images && page.images.map((img, i) => (
                        <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-white/10 group/img">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => handleRemovePageImage(page.id, i)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-md opacity-0 group-hover/img:opacity-100 hover:bg-red-500 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <label className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 hover:border-white/40 transition-colors cursor-pointer bg-zinc-900/50">
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-xs">Add Image</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAddPageImage(page.id, e)} />
                      </label>
                    </div>
                    
                    <div className="mt-2">
                      <input 
                        type="text" 
                        placeholder="Or paste image URL and press Enter..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddPageImageUrl(page.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pages.length === 0 && (
              <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-xl">
                No pages yet. Click "Add Page" to start writing.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
