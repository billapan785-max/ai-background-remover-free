
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Download, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ChevronDown,
  Info,
  Mail,
  ArrowLeft,
  Wand2
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import BackgroundRemover from './BackgroundRemover';

// --- Types ---
interface ProcessedImage {
  originalUrl: string;
  resultUrl: string;
  name: string;
}

interface FAQItemProps {
  question: string;
  answer: string;
}

type Page = 'home' | 'privacy' | 'terms' | 'contact';
type RemovalMode = 'express' | 'deep';

// --- Sub-components ---

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-lg font-semibold text-slate-800">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <p className="mt-3 text-slate-600 leading-relaxed animate-in slide-in-from-top-2 duration-200">
          {answer}
        </p>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [removalMode, setRemovalMode] = useState<RemovalMode>('express');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const handleNavigation = (page: Page, sectionId?: string) => {
    setCurrentPage(page);
    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const processFileDeep = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      setStatus('Initializing Deep AI engine...');
      
      const originalUrl = URL.createObjectURL(file);

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const percentage = Math.round((current / total) * 100);
          setProgress(percentage);
          if (key === 'compute') setStatus('Analyzing complex layers...');
          else if (key.includes('fetch')) setStatus('Downloading Deep AI models...');
          else setStatus(`Processing (${percentage}%)...`);
        },
      });

      const resultUrl = URL.createObjectURL(blob);
      setResult({
        originalUrl,
        resultUrl,
        name: file.name.split('.')[0] + '_transparent.png'
      });
      setIsProcessing(false);
    } catch (err) {
      console.error(err);
      setError('Deep AI failed. The model may be too heavy for your browser.');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (removalMode === 'deep') {
        processFileDeep(file);
      } else {
        // Express mode handles itself through the BackgroundRemover component
        const originalUrl = URL.createObjectURL(file);
        setResult({
          originalUrl,
          resultUrl: '', // Will be updated by BackgroundRemover
          name: file.name.split('.')[0] + '_transparent.png'
        });
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (removalMode === 'deep') processFileDeep(file);
      else {
        const originalUrl = URL.createObjectURL(file);
        setResult({ originalUrl, resultUrl: '', name: file.name.split('.')[0] + '_transparent.png' });
      }
    }
  };

  const reset = () => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      if (result.resultUrl) URL.revokeObjectURL(result.resultUrl);
    }
    setResult(null);
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    setStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadResult = () => {
    if (!result || !result.resultUrl) return;
    const link = document.createElement('a');
    link.href = result.resultUrl;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleNavigation('home')}
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Magic<span className="text-indigo-600">BG</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => handleNavigation('home')} className={`hover:text-indigo-600 transition-colors ${currentPage === 'home' ? 'text-indigo-600 underline underline-offset-4' : ''}`}>Home</button>
            <button onClick={(e) => { e.preventDefault(); handleNavigation('home', 'how-to'); }} className="hover:text-indigo-600 transition-colors">How it works</button>
            <button onClick={() => handleNavigation('contact')} className={`hover:text-indigo-600 transition-colors ${currentPage === 'contact' ? 'text-indigo-600 underline underline-offset-4' : ''}`}>Contact</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        {currentPage === 'home' && (
          <div className="animate-in fade-in duration-500">
            <section className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Remove Backgrounds <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-8">Instantly</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
                Choose between <span className="text-indigo-600 font-bold">Express Mode</span> (Instant results) or <span className="text-amber-600 font-bold">Deep AI</span> (Studio precision).
              </p>

              {/* Mode Toggle */}
              {!result && !isProcessing && (
                <div className="flex items-center justify-center gap-4 mb-12">
                  <button 
                    onClick={() => setRemovalMode('express')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${removalMode === 'express' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-50' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                  >
                    <Zap className="w-5 h-5" /> Express Mode (Fast)
                  </button>
                  <button 
                    onClick={() => setRemovalMode('deep')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${removalMode === 'deep' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 ring-4 ring-amber-50' : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-300'}`}
                  >
                    <Wand2 className="w-5 h-5" /> Deep AI (Premium Quality)
                  </button>
                </div>
              )}

              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col transition-all">
                {!selectedFile && !isProcessing && (
                  <div 
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex-1 flex flex-col items-center justify-center p-12 text-center group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Drop your image here</h3>
                    <p className="text-slate-500 mb-8 max-w-sm">
                      Processing mode: <span className="font-bold text-indigo-600 capitalize">{removalMode}</span>
                    </p>
                    
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <button className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3 text-lg">
                      Select a File
                    </button>
                    {error && (
                      <div className="mt-8 flex items-center gap-2 text-red-600 bg-red-50 px-6 py-3 rounded-xl border border-red-100 animate-bounce">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                      </div>
                    )}
                  </div>
                )}

                {isProcessing && (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                    <div className="relative mb-10">
                      <div className="w-36 h-36 rounded-full border-[6px] border-slate-200 border-t-amber-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-slate-700">{progress}%</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-3">Deep AI Analyzing...</h3>
                    <p className="text-slate-500 mb-8 font-medium">{status}</p>
                    <div className="w-full max-w-md h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {result && !isProcessing && (
                  <div className="flex-1 flex flex-col p-6 md:p-12 animate-in fade-in zoom-in duration-500">
                    <div className="grid lg:grid-cols-2 gap-10 flex-1">
                      <div className="flex flex-col gap-4">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Original
                        </span>
                        <div className="relative aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200">
                          <img src={result.originalUrl} alt="Original" className="w-full h-full object-contain p-4" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> {removalMode === 'express' ? 'Express Preview' : 'Deep AI Result'}
                        </span>
                        <div 
                          className="relative aspect-square rounded-3xl overflow-hidden border-4 border-indigo-100 shadow-xl"
                          style={{
                            backgroundImage: 'repeating-conic-gradient(#f8fafc 0% 25%, #fff 0% 50%)',
                            backgroundSize: '24px 24px'
                          }}
                        >
                          {removalMode === 'express' && selectedFile ? (
                            <div className="w-full h-full p-4 relative flex items-center justify-center">
                              <BackgroundRemover 
                                file={selectedFile} 
                                onResult={(url) => setResult({...result, resultUrl: url})}
                                onError={setError}
                              />
                              {result.resultUrl && <img src={result.resultUrl} alt="Result" className="absolute inset-0 w-full h-full object-contain p-4 drop-shadow-2xl" />}
                            </div>
                          ) : (
                            <img src={result.resultUrl} alt="Result" className="w-full h-full object-contain p-4 drop-shadow-2xl" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                      <button onClick={reset} className="flex items-center gap-3 text-slate-400 hover:text-slate-800 transition-colors font-bold group">
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> Start Over
                      </button>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button onClick={reset} className="flex-1 sm:flex-none px-8 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors">Discard</button>
                        <button onClick={downloadResult} className="flex-1 sm:flex-none px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3">
                          <Download className="w-6 h-6" /> Download PNG
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section id="how-to" className="py-24 border-t border-slate-100 scroll-mt-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Speed Meets Precision</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">We offer two distinct ways to clear your backgrounds, so you always have the right tool for the job.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-white p-10 rounded-[2rem] border-2 border-indigo-100 shadow-xl shadow-indigo-50">
                   <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4">Express Mode</h4>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> Works in milliseconds locally</li>
                    <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> Instant sliders to refine threshold</li>
                    <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> Zero model downloads required</li>
                    <li className="flex gap-3"><Info className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Best for solid backgrounds</li>
                  </ul>
                </div>
                <div className="bg-white p-10 rounded-[2rem] border-2 border-amber-100 shadow-xl shadow-amber-50">
                   <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200">
                    <Wand2 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4">Deep AI Mode</h4>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> Studio-grade pixel masking</li>
                    <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> Handles complex hair & textures</li>
                    <li className="flex gap-3"><CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> 100% Fully automatic AI</li>
                    <li className="flex gap-3"><Info className="w-5 h-5 text-amber-500 flex-shrink-0" /> Best for complex lifestyle photos</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section id="faq" className="py-24 max-w-3xl mx-auto scroll-mt-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-2">
                <FAQItem question="Why is Express Mode so fast?" answer="Express Mode uses raw Canvas pixel data and a thresholding algorithm that detects background clusters. It doesn't need to load heavy AI models, making it literally instant." />
                <FAQItem question="When should I use Deep AI?" answer="Use Deep AI when you have a complex background with many colors, or when the subject has fine details like hair or fur that the Express Mode might miss." />
                <FAQItem question="Are my photos safe?" answer="Yes! Regardless of the mode you choose, all processing happens on your own computer. We never see or store your images." />
              </div>
            </section>
          </div>
        )}

        {currentPage === 'privacy' && (
          <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => handleNavigation('home')} className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:translate-x-1 transition-transform">
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
            <div className="prose prose-slate lg:prose-lg max-w-none text-slate-600 space-y-6">
              <p className="text-lg font-medium text-slate-800">Effective Date: October 2024</p>
              <p>MagicBG uses 100% Client-Side processing. Your images never touch our servers.</p>
              <h3 className="text-xl font-bold text-slate-900">1. Local Execution</h3>
              <p>The processing engine (whether Express or Deep AI) runs entirely within your browser's runtime. No image data is transmitted over the network for processing.</p>
            </div>
          </div>
        )}

        {currentPage === 'contact' && (
          <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 text-center">
            <button onClick={() => handleNavigation('home')} className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:translate-x-1 transition-transform mx-auto">
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Mail className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">Get in Touch</h1>
            <p className="text-xl text-slate-600 mb-12">Email us at: support@securecheckai.online</p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6 text-white cursor-pointer inline-flex" onClick={() => handleNavigation('home')}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">MagicBG</span>
              </div>
              <p className="max-w-xs leading-relaxed text-sm">Privacy-focused AI background removal tool.</p>
            </div>
            <div>
              <h6 className="text-white font-bold mb-6 text-xs uppercase">Navigation</h6>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => handleNavigation('home')} className="hover:text-indigo-400">Home</button></li>
                <li><button onClick={() => handleNavigation('privacy')} className="hover:text-indigo-400">Privacy</button></li>
                <li><button onClick={() => handleNavigation('contact')} className="hover:text-indigo-400">Support</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-xs">
            <p>© 2024 MagicBG AI. SecureCheckAI.online Partner.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
