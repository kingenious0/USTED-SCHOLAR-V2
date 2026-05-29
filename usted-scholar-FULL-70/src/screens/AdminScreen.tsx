import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Database, Plus, Trash2, ArrowLeft, Zap, Sparkles, Pencil, X, Search, Users, BookOpen, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ACADEMIC_DATA } from '../lib/academicData';
import { extractTextFromPdf } from '../lib/pdfUtils';
import { generateSynthesis } from '../lib/ai';

const GATEWAY_URL = 'https://wruymvxttqlxgcvwfcop.supabase.co/functions/v1/ai-gateway';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminScreen() {
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState({ current: 0, total: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'warning' | 'error' | null, message: string }>({ type: null, message: '' });

  const [activeTab, setActiveTab] = useState<'courses' | 'users'>('courses');
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [level, setLevel] = useState('100');
  const [semester, setSemester] = useState('1');
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [useSniperMode, setUseSniperMode] = useState(true);

  const toggleProgramme = (val: string) => {
    if (val === 'GENERAL') {
      setProgrammes(prev => prev.includes('GENERAL') ? [] : ['GENERAL']);
      return;
    }
    setProgrammes(prev =>
      prev.includes(val) ? prev.filter(p => p !== val) : [...prev.filter(p => p !== 'GENERAL'), val]
    );
  };

  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editProgrammes, setEditProgrammes] = useState<string[]>([]);

  const toggleEditProgramme = (val: string) => {
    if (val === 'GENERAL') {
      setEditProgrammes(prev => prev.includes('GENERAL') ? [] : ['GENERAL']);
      return;
    }
    setEditProgrammes(prev =>
      prev.includes(val) ? prev.filter(p => p !== val) : [...prev.filter(p => p !== 'GENERAL'), val]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    setEditSaving(true);
    setEditError(null);
    const metaTag = `L${editingCourse.level || '100'}_S${editingCourse.semester || '1'}`;
    const legacyProgramme = editProgrammes.length === 1 ? editProgrammes[0] : (editProgrammes[0] || editingCourse.programme || '');
    const { error } = await supabase
      .from('courses')
      .update({
        name: editingCourse.name,
        meta_tag: metaTag,
        programme: legacyProgramme,
        programmes: editProgrammes,
        level: editingCourse.level,
        semester: editingCourse.semester,
      })
      .eq('id', editingCourse.id);

    if (error) {
      const { error: fallbackError } = await supabase
        .from('courses')
        .update({ name: editingCourse.name, meta_tag: metaTag })
        .eq('id', editingCourse.id);
      if (fallbackError) {
        setEditError(fallbackError.message);
        setEditSaving(false);
        return;
      }
      setEditError('⚠ Name saved. To save Programme/Level, run the ALTER TABLE SQL in Supabase first.');
      setEditSaving(false);
      fetchCourses();
      return;
    }
    setEditSaving(false);
    setEditingCourse(null);
    fetchCourses();
  };

  useEffect(() => {
    fetchCourses();
    fetchUsers();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      const originalTitle = document.title;
      interval = setInterval(() => {
        if (document.hidden && isOptimizing) {
          document.title = '⚠️ PAUSED - Keep Tab Open!';
        } else if (isOptimizing) {
          document.title = `⏳ Sniper Mode (${optProgress.current}/${optProgress.total})`;
        } else {
          document.title = '⏳ Syncing with Storage...';
        }
      }, 1000);
      return () => {
        clearInterval(interval);
        document.title = originalTitle;
      };
    }
  }, [loading, isOptimizing, optProgress]);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
  }

  async function fetchCourses() {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCourses(data);
  }

  const heavyCompress = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    
    // Dynamic imports of heavy PDF utility engines on demand
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    const { jsPDF } = await import('jspdf');

    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const outPdf = new jsPDF({ compress: true });
    const totalPages = pdf.numPages;
    setOptProgress({ current: 0, total: totalPages });

    const pageImages: string[] = new Array(totalPages);
    const BATCH_SIZE = 5;

    for (let batchStart = 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
      const promises = [];

      for (let i = batchStart; i <= batchEnd; i++) {
        promises.push((async (pageNumber) => {
          try {
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 0.95 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvas: canvas, canvasContext: context!, viewport } as any).promise;
            const imgData = canvas.toDataURL('image/jpeg', 0.35);
            pageImages[pageNumber - 1] = imgData;
          } catch (err) {
            console.error(`Error rendering page ${pageNumber}:`, err);
          } finally {
            setOptProgress(p => ({ ...p, current: Math.min(p.current + 1, totalPages) }));
          }
        })(i));
      }
      await Promise.all(promises);
    }

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) outPdf.addPage();
      const pdfWidth = outPdf.internal.pageSize.getWidth();
      const pdfHeight = outPdf.internal.pageSize.getHeight();
      if (pageImages[i]) {
        outPdf.addImage(pageImages[i], 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    }

    return outPdf.output('blob');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return;

    setLoading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      let fileToUpload: Blob | File = file;
      let extractedText = '';

      try {
        setUploadStatus({ type: null, message: 'Extracting academic DNA...' });
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await extractTextFromPdf(
          arrayBuffer, 
          (current, total) => {
            setUploadStatus({ 
              type: null, 
              message: `Extracting academic DNA (OCR): Page ${current} of ${total}...` 
            });
          },
          false // DO NOT skip OCR - let it auto-detect and run parallel Tesseract when scanned
        );
      } catch (err: any) {
        console.warn("Local text extraction/OCR failed:", err);
      }

      if (useSniperMode && file.size > 10 * 1024 * 1024) {
        setIsOptimizing(true);
        setUploadStatus({ type: null, message: 'Sniper Mode: Compressing...' });

        try {
          const compressedBlob = await heavyCompress(file);
          if (compressedBlob.size < file.size) {
            console.log(`✅ Sniper Success: Reduced from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
            fileToUpload = compressedBlob;
          } else {
            console.log(`⚠ Sniper Aborted: Original file was already better optimized`);
            fileToUpload = file;
          }
        } catch (compError) {
          console.warn("Sniper failed, using original:", compError);
          fileToUpload = file;
        }

        setIsOptimizing(false);
      }

      if (fileToUpload.size > 50 * 1024 * 1024) {
        throw new Error(`File is ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB. Supabase free tier limits uploads to 50MB.`);
      }

      setUploadStatus({ type: null, message: 'Syncing with Storage...' });
      const fileExt = 'pdf';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const metaTag = `L${level}_S${semester}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('course-materials')
        .upload(`${metaTag}/${fileName}`, fileToUpload);

      if (storageError) throw storageError;

      const courseFileId = Math.random().toString(36).substring(2, 15);
      const { error: dbError } = await supabase
        .from('courses')
        .insert([{
          name,
          meta_tag: metaTag,
          storage_path: storageData.path,
          programme: programmes.length === 1 ? programmes[0] : programmes.join(','),
          programmes: programmes,
          file_type: 'PDF',
          file_id: courseFileId,
          full_text: extractedText
        }]);

      if (dbError) throw dbError;

      // Cloud OCR is now fully decommissioned since we index text locally on the client!
      const charCount = extractedText ? extractedText.length : 0;
      setUploadStatus({ 
        type: 'success', 
        message: `Success! Course uploaded and ${(charCount / 1000).toFixed(1)}k characters indexed locally.` 
      });

      setName('');
      setProgrammes([]);
      setFile(null);
      fetchCourses();
    } catch (error: any) {
      setUploadStatus({ type: 'error', message: error.message || 'Upload failed' });
    } finally {
      setLoading(false);
      setIsOptimizing(false);
      setOptProgress({ current: 0, total: 0 });
    }
  };

  const deleteCourse = async (id: string, path: string) => {
    if (!confirm('Delete this course record and file?')) return;
    await supabase.storage.from('course-materials').remove([path]);
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses();
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This removes their profile and login.`)) return;
    setDeletingUser(id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manager', {
        body: { action: 'deleteUser', userId: id }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (error: any) {
      const errorMsg = error.context?.json?.error || error.message || 'Unknown error';
      alert(`Failed to delete user: ${errorMsg}`);
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300 relative">
      {/* Background Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-bl from-electric-blue/5 to-transparent blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-sunset-orange/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 p-6 lg:p-10 max-w-7xl mx-auto pb-28 lg:pb-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-electric-blue mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Back</span>
            </Link>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">System Admin</h1>
            <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs mt-2">Manage Academic Knowledge Base</p>
          </div>
          <div className="hidden md:flex gap-4">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center gap-4 hover:border-electric-blue/30 transition-all">
              <BookOpen className="w-8 h-8 text-electric-blue" />
              <div>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Courses</p>
                <p className="text-xl font-black text-[var(--text-primary)]">{courses.length}</p>
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all">
              <Users className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Scholars</p>
                <p className="text-xl font-black text-[var(--text-primary)]">{users.length}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-10 bg-[var(--bg-secondary)] p-1.5 rounded-2xl border border-[var(--border-color)] w-full max-w-md">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'courses' ? 'bg-gradient-to-r from-electric-blue to-blue-600 text-white shadow-lg' : 'text-[var(--text-tertiary)]'}`}
          >
            Manage Courses
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'users' ? 'bg-gradient-to-r from-electric-blue to-blue-600 text-white shadow-lg' : 'text-[var(--text-tertiary)]'}`}
          >
            Manage Scholars
          </button>
        </div>

        {activeTab === 'courses' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <section className="lg:col-span-1">
              <form onSubmit={handleUpload} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-electric-blue/10 to-transparent blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                <h2 className="text-xl font-black text-[var(--text-primary)] mb-8 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Add Course
                </h2>

                <div className="space-y-5">
                  {/* Programmes */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">
                      Programmes
                      {programmes.length > 0 && <span className="ml-2 text-electric-blue">({programmes.includes('GENERAL') ? 'All' : programmes.length})</span>}
                    </label>
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                      <button type="button" onClick={() => toggleProgramme('GENERAL')}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--border-color)] transition-colors ${programmes.includes('GENERAL') ? 'bg-electric-blue/10' : 'hover:bg-[var(--bg-secondary)]'}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${programmes.includes('GENERAL') ? 'bg-electric-blue border-electric-blue' : 'border-[var(--border-color)]'}`}>
                          {programmes.includes('GENERAL') && <span className="text-white text-[8px] font-black">✓</span>}
                        </div>
                        <span className="text-xs font-black text-[var(--text-primary)]">All Programmes</span>
                      </button>
                      {ACADEMIC_DATA.departments.map(dept => (
                        <div key={dept}>
                          <p className="px-4 py-1.5 text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-secondary)]/50">{dept}</p>
                          {ACADEMIC_DATA.programs.filter(p => p.dept === dept).map(p => (
                            <button key={p.name} type="button" onClick={() => toggleProgramme(p.name)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${programmes.includes(p.name) ? 'bg-electric-blue/10' : 'hover:bg-[var(--bg-secondary)]'}`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${programmes.includes(p.name) ? 'bg-electric-blue border-electric-blue' : 'border-[var(--border-color)]'}`}>
                                {programmes.includes(p.name) && <span className="text-white text-[8px] font-black">✓</span>}
                              </div>
                              <span className="text-[11px] font-bold text-[var(--text-primary)]">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Course Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Introduction to Logic"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all text-sm font-bold"
                    />
                  </div>

                  {/* Level & Semester */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Level</label>
                      <select value={level} onChange={(e) => setLevel(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all text-sm font-bold appearance-none cursor-pointer">
                        <option value="100">L100</option>
                        <option value="200">L200</option>
                        <option value="300">L300</option>
                        <option value="400">L400</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Semester</label>
                      <select value={semester} onChange={(e) => setSemester(e.target.value)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all text-sm font-bold appearance-none cursor-pointer">
                        <option value="1">Sem 1</option>
                        <option value="2">Sem 2</option>
                      </select>
                    </div>
                  </div>

                  {/* Sniper Mode */}
                  <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <Zap className={`w-4 h-4 text-white ${useSniperMode ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[var(--text-primary)]">Sniper Compression</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] font-bold">Compress files &gt; 10MB</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" checked={useSniperMode} onChange={(e) => setUseSniperMode(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue peer-checked:after:bg-white"></div>
                    </label>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Document (PDF)</label>
                    <div className="relative">
                      <input type="file" accept=".pdf" required onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="w-full bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl py-8 px-6 flex flex-col items-center justify-center gap-2 transition-all hover:border-electric-blue/30">
                        <Upload className={`w-6 h-6 ${file ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'}`} />
                        <p className="text-xs font-black text-[var(--text-tertiary)] uppercase text-center">
                          {file ? file.name : 'Click or drag PDF here'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading || !file || !name || programmes.length === 0}
                    className="w-full bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-electric-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex flex-col items-center justify-center gap-1"
                  >
                    {loading ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isOptimizing ? 'Optimizing...' : 'Uploading...'}
                        </div>
                        {isOptimizing && (
                          <div className="w-full px-8 mt-2">
                            <div className="flex justify-between text-[8px] mb-1">
                              <span>SNIPER</span>
                              <span>{optProgress.current}/{optProgress.total}</span>
                            </div>
                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-white transition-all duration-300" style={{ width: `${(optProgress.current / optProgress.total) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </>
                    ) : 'Inject Course Material'}
                  </button>

                  {/* Status */}
                  <AnimatePresence>
                    {uploadStatus.message && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`p-4 rounded-xl flex items-center gap-3 border ${
                          uploadStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : uploadStatus.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : uploadStatus.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-electric-blue/10 text-[var(--text-primary)] border-electric-blue/20'
                        }`}
                      >
                        {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                          : uploadStatus.type === 'warning' ? <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          : uploadStatus.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          : <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                        }
                        <p className="text-xs font-bold">{uploadStatus.message}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </section>

            {/* Course List */}
            <section className="lg:col-span-2">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
                <h2 className="text-xl font-black text-[var(--text-primary)] mb-8 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sunset-orange to-amber-600 flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  Course Library
                </h2>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {courses.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl">
                      <Database className="w-10 h-10 text-[var(--text-tertiary)]/20 mx-auto mb-3" />
                      <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase">The library is empty</p>
                    </div>
                  ) : courses.map((course) => (
                    <motion.div key={course.id} layout className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center justify-between group hover:border-electric-blue/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-blue/20 to-blue-600/20 flex items-center justify-center text-electric-blue font-black text-xs shadow-sm">
                          {course.meta_tag}
                        </div>
                        <div>
                          <h4 className="font-black text-[var(--text-primary)] uppercase tracking-tight text-sm mb-0.5">{course.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-[9px] font-black text-electric-blue bg-electric-blue/10 border border-electric-blue/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              {course.meta_tag}
                            </span>
                            {course.programme ? (
                              <span className="text-[9px] font-black text-sunset-orange bg-sunset-orange/10 border border-sunset-orange/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {course.programme === 'GENERAL' ? 'All' : course.programme.replace('B.Sc. ', '').replace('B.Ed. ', '')}
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                No Programme
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => {
                          const existingProgs = Array.isArray(course.programmes) && course.programmes.length > 0
                            ? course.programmes : course.programme ? [course.programme] : [];
                          setEditProgrammes(existingProgs);
                          setEditingCourse({ ...course, level: course.level || '100', semester: course.semester || '1' });
                        }}
                          className="p-2.5 text-[var(--text-tertiary)] hover:text-electric-blue hover:bg-electric-blue/5 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteCourse(course.id, course.storage_path)}
                          className="p-2.5 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* Users Tab */
          <section>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Scholar Directory
                </h2>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                  <input type="text" placeholder="Search by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-3 pl-10 pr-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/20 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {users.filter(u =>
                  u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(userSearch.toLowerCase())
                ).map(user => (
                  <motion.div key={user.id} layout className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-5 hover:border-electric-blue/30 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-blue to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
                          {user.name?.[0] || 'S'}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm">{user.name || 'Anonymous'}</h4>
                          <p className="text-[10px] text-[var(--text-tertiary)] font-medium truncate max-w-[150px]">{user.email || 'No email'}</p>
                        </div>
                      </div>
                      <button disabled={deletingUser === user.id} onClick={() => deleteUser(user.id, user.name)}
                        className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                        {deletingUser === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border-color)]">
                      <span className="text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest px-2 py-0.5 bg-[var(--bg-secondary)] rounded-full">
                        {user.level ? `L${user.level}` : 'No Level'}
                      </span>
                      <span className="text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest px-2 py-0.5 bg-[var(--bg-secondary)] rounded-full truncate max-w-[100px]">
                        {user.programme || 'No Programme'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {users.length === 0 && (
                <div className="py-16 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl">
                  <Users className="w-10 h-10 text-[var(--text-tertiary)]/20 mx-auto mb-3" />
                  <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase">No scholars found</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setEditingCourse(null)}
          >
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-electric-blue uppercase tracking-widest mb-1">Edit Course</p>
                  <h2 className="text-xl font-black text-[var(--text-primary)]">Update Details</h2>
                </div>
                <button onClick={() => setEditingCourse(null)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors">
                  <X className="w-5 h-5 text-[var(--text-tertiary)]" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">
                    Programmes
                    {editProgrammes.length > 0 && <span className="ml-2 text-electric-blue">({editProgrammes.includes('GENERAL') ? 'All' : editProgrammes.length})</span>}
                  </label>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    <button type="button" onClick={() => toggleEditProgramme('GENERAL')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--border-color)] transition-colors ${editProgrammes.includes('GENERAL') ? 'bg-electric-blue/10' : 'hover:bg-[var(--bg-primary)]'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${editProgrammes.includes('GENERAL') ? 'bg-electric-blue border-electric-blue' : 'border-[var(--border-color)]'}`}>
                        {editProgrammes.includes('GENERAL') && <span className="text-white text-[8px] font-black">✓</span>}
                      </div>
                      <span className="text-xs font-black text-[var(--text-primary)]">All Programmes</span>
                    </button>
                    {ACADEMIC_DATA.departments.map(dept => (
                      <div key={dept}>
                        <p className="px-4 py-1 text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-primary)]/60">{dept}</p>
                        {ACADEMIC_DATA.programs.filter(p => p.dept === dept).map(p => (
                          <button key={p.name} type="button" onClick={() => toggleEditProgramme(p.name)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${editProgrammes.includes(p.name) ? 'bg-electric-blue/10' : 'hover:bg-[var(--bg-primary)]'}`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${editProgrammes.includes(p.name) ? 'bg-electric-blue border-electric-blue' : 'border-[var(--border-color)]'}`}>
                              {editProgrammes.includes(p.name) && <span className="text-white text-[8px] font-black">✓</span>}
                            </div>
                            <span className="text-[11px] font-bold text-[var(--text-primary)]">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Course Name</label>
                  <input type="text" value={editingCourse.name} onChange={(e) => setEditingCourse((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3.5 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Level</label>
                    <select value={editingCourse.level || '100'} onChange={(e) => setEditingCourse((p: any) => ({ ...p, level: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3.5 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/20 appearance-none cursor-pointer">
                      <option value="100">L100</option>
                      <option value="200">L200</option>
                      <option value="300">L300</option>
                      <option value="400">L400</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Semester</label>
                    <select value={editingCourse.semester || '1'} onChange={(e) => setEditingCourse((p: any) => ({ ...p, semester: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3.5 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-electric-blue/20 appearance-none cursor-pointer">
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                </div>
              </div>

              {editError && (
                <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-amber-500 text-xs font-bold leading-relaxed">{editError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => { setEditingCourse(null); setEditError(null); }}
                  className="flex-1 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={editSaving}
                  className="flex-1 py-4 bg-gradient-to-r from-electric-blue to-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-electric-blue/20 disabled:opacity-60 flex items-center justify-center gap-2">
                  {editSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
