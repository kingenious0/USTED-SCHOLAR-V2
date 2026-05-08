import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database, Plus, Trash2, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

// Configure PDF.js Worker (Vite-compatible local worker)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function AdminScreen() {
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState({ current: 0, total: 0 });
  const [courses, setCourses] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  
  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState('100');
  const [semester, setSemester] = useState('1');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCourses(data);
  }

  const heavyCompress = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const outPdf = new jsPDF();
    const totalPages = pdf.numPages;
    setOptProgress({ current: 0, total: totalPages });

    for (let i = 1; i <= totalPages; i++) {
      setOptProgress(p => ({ ...p, current: i }));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Lower resolution to save size
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context!, viewport }).promise;

      // Convert to 50% quality JPEG
      const imgData = canvas.toDataURL('image/jpeg', 0.5); 
      
      if (i > 1) outPdf.addPage();
      
      // A4 dimensions in mm
      const pdfWidth = outPdf.internal.pageSize.getWidth();
      const pdfHeight = outPdf.internal.pageSize.getHeight();
      outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
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

      // --- SCANNED NOTE SNIPER (HEAVY OPTIMIZER) ---
      // If file is larger than 10MB, we perform lossy compression
      if (file.size > 10 * 1024 * 1024) {
        setIsOptimizing(true);
        setUploadStatus({ type: null, message: 'Sniper Mode: Compressing scanned images... 🎯' });
        
        try {
          const compressedBlob = await heavyCompress(file);
          console.log(`✅ Sniper Success: Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
          fileToUpload = compressedBlob;
        } catch (compError) {
          console.warn("Heavy compression failed, using original:", compError);
          fileToUpload = file;
        }
        
        setIsOptimizing(false);
      }
      // ----------------------------------------------

      setUploadStatus({ type: null, message: 'Syncing with Supabase Storage...' });
      const fileExt = 'pdf'; 
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const metaTag = `L${level}_S${semester}`;
      
      // 1. Upload to Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('course-materials')
        .upload(`${metaTag}/${fileName}`, fileToUpload);

      if (storageError) throw storageError;

      // 2. Insert into DB
      const { error: dbError } = await supabase
        .from('courses')
        .insert([{
          name,
          meta_tag: metaTag,
          storage_path: storageData.path,
          file_type: 'PDF',
          file_id: Math.random().toString(36).substring(2, 15)
        }]);

      if (dbError) throw dbError;

      setUploadStatus({ type: 'success', message: 'Course uploaded and snipered!' });
      setName('');
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
    if (!confirm('Are you sure? This will delete the record and the file.')) return;
    
    await supabase.storage.from('course-materials').remove([path]);
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 lg:p-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
             <Link to="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Dashboard</span>
             </Link>
             <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">System Admin</h1>
             <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-xs mt-2">Manage Academic Knowledge Base</p>
          </div>
          <div className="hidden md:flex gap-4">
             <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center gap-4">
                <Database className="w-8 h-8 text-[var(--accent-primary)]" />
                <div>
                   <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Total Courses</p>
                   <p className="text-xl font-black text-[var(--text-primary)]">{courses.length}</p>
                </div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Upload Form */}
          <section className="lg:col-span-1">
             <form onSubmit={handleUpload} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <h2 className="text-xl font-black text-[var(--text-primary)] mb-8 flex items-center gap-3">
                   <Plus className="w-6 h-6 text-[var(--accent-primary)]" />
                   Add New Course
                </h2>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Course Name</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Introduction to Logic"
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-sm font-bold"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Level</label>
                         <select 
                           value={level}
                           onChange={(e) => setLevel(e.target.value)}
                           className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-sm font-bold appearance-none cursor-pointer"
                         >
                            <option value="100">L100</option>
                            <option value="200">L200</option>
                            <option value="300">L300</option>
                            <option value="400">L400</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Semester</label>
                         <select 
                           value={semester}
                           onChange={(e) => setSemester(e.target.value)}
                           className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all text-sm font-bold appearance-none cursor-pointer"
                         >
                            <option value="1">Sem 1</option>
                            <option value="2">Sem 2</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Document (PDF)</label>
                      <div className="relative">
                         <input 
                           type="file" 
                           accept=".pdf"
                           required
                           onChange={(e) => setFile(e.target.files?.[0] || null)}
                           className="absolute inset-0 opacity-0 cursor-pointer z-10"
                         />
                         <div className="w-full bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl py-10 px-6 flex flex-col items-center justify-center gap-3 group-hover:border-[var(--accent-primary)] transition-all">
                            <Upload className={`w-8 h-8 ${file ? 'text-emerald-500' : 'text-[var(--text-tertiary)]'}`} />
                            <p className="text-xs font-black text-[var(--text-tertiary)] uppercase text-center">
                               {file ? file.name : 'Click or Drag PDF here'}
                            </p>
                         </div>
                      </div>
                   </div>

                   <button 
                     type="submit"
                     disabled={loading || !file || !name}
                     className="w-full bg-[var(--accent-primary)] text-white rounded-2xl py-5 font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--accent-primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex flex-col items-center justify-center gap-1"
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
                                     <span>SNIPER MODE</span>
                                     <span>{optProgress.current}/{optProgress.total}</span>
                                  </div>
                                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                     <div 
                                       className="h-full bg-white transition-all duration-300" 
                                       style={{ width: `${(optProgress.current / optProgress.total) * 100}%` }}
                                     />
                                  </div>
                               </div>
                            )}
                         </>
                      ) : 'Inject Course Material'}
                   </button>

                   <AnimatePresence>
                      {uploadStatus.type && (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0 }}
                           className={`p-4 rounded-xl flex items-center gap-3 ${uploadStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                         >
                            {uploadStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
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
                   <FileText className="w-6 h-6 text-[var(--accent-secondary)]" />
                   Existing Materials
                </h2>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                   {courses.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-3xl">
                         <Database className="w-12 h-12 text-[var(--text-tertiary)]/20 mx-auto mb-4" />
                         <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase">The library is empty</p>
                      </div>
                   ) : courses.map((course) => (
                      <div key={course.id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center justify-between group hover:border-[var(--accent-primary)]/30 transition-all">
                         <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--accent-primary)] font-black text-xs">
                               {course.meta_tag}
                            </div>
                            <div>
                               <h4 className="font-black text-[var(--text-primary)] uppercase tracking-tight text-sm mb-0.5">{course.name}</h4>
                               <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">{course.file_type || 'PDF'} • {course.storage_path?.split('/').pop()}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => deleteCourse(course.id, course.storage_path)}
                           className="p-3 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
