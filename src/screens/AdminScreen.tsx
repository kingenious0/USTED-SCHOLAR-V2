import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database, Plus, Trash2, ArrowLeft, Zap, Sparkles, Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { ACADEMIC_DATA } from '../lib/academicData';

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
  const [programmes, setProgrammes] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const toggleProgramme = (val: string) => {
    if (val === 'GENERAL') {
      setProgrammes(prev => prev.includes('GENERAL') ? [] : ['GENERAL']);
      return;
    }
    setProgrammes(prev =>
      prev.includes(val)
        ? prev.filter(p => p !== val)
        : [...prev.filter(p => p !== 'GENERAL'), val]
    );
  };

  // Edit Modal State
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

    // Try full update (requires programme/level/semester columns to exist in DB)
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
      // Fallback: update only name + meta_tag which always exist
      const { error: fallbackError } = await supabase
        .from('courses')
        .update({ name: editingCourse.name, meta_tag: metaTag })
        .eq('id', editingCourse.id);

      if (fallbackError) {
        setEditError(fallbackError.message);
        setEditSaving(false);
        return;
      }
      // Fallback succeeded — warn about missing columns
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
      // Reduced scale from 1.5 to 1.2 for better compression
      const viewport = page.getViewport({ scale: 1.2 }); 
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context!, viewport }).promise;

      // Reduced quality from 0.5 to 0.4 for aggressive shrinking
      const imgData = canvas.toDataURL('image/jpeg', 0.4); 
      
      if (i > 1) outPdf.addPage();
      
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

      // --- SNIPER MODE (SMART OPTIMIZER) ---
      if (file.size > 10 * 1024 * 1024) {
        setIsOptimizing(true);
        setUploadStatus({ type: null, message: 'Sniper Mode: Hunting for bloat... 🎯' });
        
        try {
          const compressedBlob = await heavyCompress(file);
          
          // CRITICAL FIX: Only use compressed if it's actually smaller!
          if (compressedBlob.size < file.size) {
            console.log(`✅ Sniper Success: Reduced from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`);
            fileToUpload = compressedBlob;
          } else {
            console.log(`⚠ Sniper Aborted: Original file was already better optimized (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            fileToUpload = file;
          }
        } catch (compError) {
          console.warn("Sniper failed, using original:", compError);
          fileToUpload = file;
        }
        
        setIsOptimizing(false);
      }

      // Check for Supabase 50MB Hard Limit
      if (fileToUpload.size > 50 * 1024 * 1024) {
        throw new Error(`File is ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB. Supabase free tier limits uploads to 50MB. Please use a smaller file.`);
      }

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
          programme: programmes.length === 1 ? programmes[0] : programmes.join(','), // legacy compat
          programmes: programmes,   // new array column
          file_type: 'PDF',
          file_id: Math.random().toString(36).substring(2, 15)
        }]);

      if (dbError) throw dbError;

      setUploadStatus({ type: 'success', message: 'Course uploaded and snipered!' });
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
                      <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">Programme</label>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest ml-1">
                         Programmes
                         {programmes.length > 0 && <span className="ml-2 text-[var(--accent-primary)]">({programmes.includes('GENERAL') ? 'All' : programmes.length} selected)</span>}
                       </label>
                       <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                         <button type="button" onClick={() => toggleProgramme('GENERAL')}
                           className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--border-color)] transition-colors ${programmes.includes('GENERAL') ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--bg-secondary)]'}`}>
                           <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${programmes.includes('GENERAL') ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--border-color)]'}`}>
                             {programmes.includes('GENERAL') && <span className="text-white text-[8px] font-black">✓</span>}
                           </div>
                           <span className="text-xs font-black text-[var(--text-primary)]">📚 General / All Programmes</span>
                         </button>
                         {ACADEMIC_DATA.departments.map(dept => (
                           <div key={dept}>
                             <p className="px-4 py-1.5 text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-secondary)]/50">{dept}</p>
                             {ACADEMIC_DATA.programs.filter(p => p.dept === dept).map(p => (
                               <button key={p.name} type="button" onClick={() => toggleProgramme(p.name)}
                                 className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${programmes.includes(p.name) ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--bg-secondary)]'}`}>
                                 <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${programmes.includes(p.name) ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--border-color)]'}`}>
                                   {programmes.includes(p.name) && <span className="text-white text-[8px] font-black">✓</span>}
                                 </div>
                                 <span className="text-[11px] font-bold text-[var(--text-primary)]">{p.name}</span>
                               </button>
                             ))}
                           </div>
                         ))}
                       </div>
                    </div>
                   </div>

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
                     disabled={loading || !file || !name || programmes.length === 0}
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
                               <div className="flex items-center gap-2 flex-wrap mt-1">
                                 <span className="text-[9px] font-black text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                   {course.meta_tag}
                                 </span>
                                 {course.programme && (
                                   <span className="text-[9px] font-black text-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)]/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                     {course.programme === 'GENERAL' ? 'All Programmes' : course.programme.replace('B.Sc. ', '').replace('B.Ed. ', '')}
                                   </span>
                                 )}
                                 {!course.programme && (
                                   <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                     ⚠ No Programme Tagged
                                   </span>
                                 )}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-1">
                           <button
                             onClick={() => {
                                const existingProgs = Array.isArray(course.programmes) && course.programmes.length > 0
                                  ? course.programmes
                                  : course.programme ? [course.programme] : [];
                                setEditProgrammes(existingProgs);
                                setEditingCourse({ 
                                  ...course,
                                  level: course.level || '100',
                                  semester: course.semester || '1',
                                });
                              }}
                             className="p-3 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 rounded-xl transition-all"
                             title="Edit"
                           >
                             <Pencil className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => deleteCourse(course.id, course.storage_path)}
                             className="p-3 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                             title="Delete"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setEditingCourse(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-lg bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] p-8 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest mb-1">Edit Course Metadata</p>
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
                    {editProgrammes.length > 0 && <span className="ml-2 text-[var(--accent-primary)]">({editProgrammes.includes('GENERAL') ? 'All' : editProgrammes.length} selected)</span>}
                  </label>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <button type="button" onClick={() => toggleEditProgramme('GENERAL')}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--border-color)] transition-colors ${editProgrammes.includes('GENERAL') ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--bg-primary)]'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${editProgrammes.includes('GENERAL') ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--border-color)]'}`}>
                        {editProgrammes.includes('GENERAL') && <span className="text-white text-[8px] font-black">✓</span>}
                      </div>
                      <span className="text-xs font-black text-[var(--text-primary)]">📚 General / All Programmes</span>
                    </button>
                    {ACADEMIC_DATA.departments.map(dept => (
                      <div key={dept}>
                        <p className="px-4 py-1 text-[8px] font-black text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-primary)]/60">{dept}</p>
                        {ACADEMIC_DATA.programs.filter(p => p.dept === dept).map(p => (
                          <button key={p.name} type="button" onClick={() => toggleEditProgramme(p.name)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${editProgrammes.includes(p.name) ? 'bg-[var(--accent-primary)]/10' : 'hover:bg-[var(--bg-primary)]'}`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${editProgrammes.includes(p.name) ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'border-[var(--border-color)]'}`}>
                              {editProgrammes.includes(p.name) && <span className="text-white text-[8px] font-black">✓</span>}
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
                  <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Course Name</label>
                  <input
                    type="text"
                    value={editingCourse.name}
                    onChange={(e) => setEditingCourse((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3.5 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                  />
                </div>

                {/* Level & Semester */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Level</label>
                    <select
                      value={editingCourse.level || '100'}
                      onChange={(e) => setEditingCourse((p: any) => ({ ...p, level: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3.5 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 appearance-none cursor-pointer"
                    >
                      <option value="100">L100</option>
                      <option value="200">L200</option>
                      <option value="300">L300</option>
                      <option value="400">L400</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Semester</label>
                    <select
                      value={editingCourse.semester || '1'}
                      onChange={(e) => setEditingCourse((p: any) => ({ ...p, semester: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3.5 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 appearance-none cursor-pointer"
                    >
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
                <button
                  onClick={() => { setEditingCourse(null); setEditError(null); }}
                  className="flex-1 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex-1 py-4 bg-[var(--accent-primary)] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
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
