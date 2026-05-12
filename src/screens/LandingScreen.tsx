import { Link } from 'react-router-dom';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export default function LandingScreen() {
  const { userState } = useApp();
  return (
    <div className="relative min-h-screen pt-16 flex items-center justify-center overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2E5BFF]/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FFCC22]/5 blur-[100px] rounded-full" />
      
      <div className="container mx-auto px-6 text-center z-10">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5 }}
           className="mb-8 inline-block px-4 py-1 rounded-full border border-[#2E5BFF]/30 text-[#2E5BFF] text-xs font-black tracking-[0.2em] uppercase bg-[#2E5BFF]/5"
        >
          AI-Powered Learning Platform
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6 leading-tight tracking-tighter"
        >
          Elevate Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E5BFF] to-[#FFCC22]">
            Academic Excellence
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[var(--text-tertiary)] text-lg md:text-xl max-w-2xl mx-auto mb-10 font-medium"
        >
          Harness the precision of artificial intelligence designed for the modern African scholar. 
          Unlock deep insights, manage complex research, and master your curriculum.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link 
            to={userState.hasCompletedOnboarding ? "/library" : "/onboarding"}
            className="px-10 py-5 bg-[#2E5BFF] text-white rounded-2xl font-black text-lg hover:scale-[1.03] active:scale-[0.97] transition-all shadow-xl shadow-[#2E5BFF]/20 flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          {/* <button className="px-10 py-5 border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/5 active:scale-[0.97] transition-all flex items-center justify-center gap-2">
            <PlayCircle className="w-6 h-6" />
            Watch Demo
          </button> */}
        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative max-w-4xl mx-auto"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2E5BFF] to-[#FFCC22] rounded-[3rem] blur opacity-20" />
          <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] overflow-hidden aspect-video shadow-2xl">
            <img 
              referrerPolicy="no-referrer"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ7rao-te96swf2gWWOUtgObUF2XrmWUIvaxzP5hnN9zOy7DccinYqmpTkPQbDuYBnBCs4NAAyz2bHpdAQHo7hu0mah990dhzosfLX2p5ta4BagNN--kctFvAFFpwdEEZpqOS6YEwTPDtVNcBMlpwdexRDWWmnOYx8VXiIMGPkkT5pQ0U1hBpP04X1eMek1VFwye42VjfZhf_B6Y6PRR9dYxj7sUPN_UXzGJXQISzNzcq8i40FHmRVst7FFY48GjwlrNUvmV3svcY"
              alt="Platform Interface"
              className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
