
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
  ArrowLeft
} from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

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

// --- Sub-components (Defined outside to prevent remounting errors) ---

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const handleNavigation = (page: Page, sectionId?: string) => {
    setCurrentPage(page);
    if (sectionId) {
      // Give React time to render the new page before scrolling
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File is too large. Please use an image smaller than 15MB.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);
      setStatus('Initializing AI engine...');
      
      const originalUrl = URL.createObjectURL(file);

      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const percentage = Math.round((current / total) * 100);
          setProgress(percentage);
          if (key === 'compute') setStatus('Analyzing image layers...');
          else if (key.includes('fetch')) setStatus('Downloading AI models...');
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
      setStatus('Success!');
    } catch (err) {
      console.error(err);
      setError('Processing failed. This can happen if the browser runs out of memory or the image is unsupported.');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    if (result) {
      URL.revokeObjectURL(result.originalUrl);
      URL.revokeObjectURL(result.resultUrl);
    }
    setResult(null);
    setError(null);
    setProgress(0);
    setStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.resultUrl;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
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
            <button 
              onClick={() => handleNavigation('home')} 
              className={`hover:text-indigo-600 transition-colors ${currentPage === 'home' ? 'text-indigo-600 underline underline-offset-4' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('home', 'how-to');
              }} 
              className="hover:text-indigo-600 transition-colors"
            >
              How it works
            </button>
            <button 
              onClick={() => handleNavigation('contact')} 
              className={`hover:text-indigo-600 transition-colors ${currentPage === 'contact' ? 'text-indigo-600 underline underline-offset-4' : ''}`}
            >
              Contact
            </button>
          </div>
          <div className="md:hidden">
            <button 
              onClick={() => handleNavigation('home')}
              className="p-2 text-indigo-600"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
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
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12">
                Professional-grade AI background removal that runs entirely in your browser. 
                Keep your data private and your workflow fast.
              </p>

              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col transition-all">
                {!result && !isProcessing && (
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
                      JPG, PNG, or WebP up to 15MB. No registration required.
                    </p>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept="image/*"
                    />
                    
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
                      <div className="w-36 h-36 rounded-full border-[6px] border-slate-200 border-t-indigo-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-slate-700">{progress}%</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-3">AI is working...</h3>
                    <p className="text-slate-500 mb-8 font-medium">{status}</p>
                    <div className="w-full max-w-md h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-8 text-sm text-slate-400 max-w-sm leading-relaxed italic">
                      Tip: The first processing takes a moment to load the AI model into your browser's memory.
                    </p>
                  </div>
                )}

                {result && (
                  <div className="flex-1 flex flex-col p-6 md:p-12 animate-in fade-in zoom-in duration-500">
                    <div className="grid lg:grid-cols-2 gap-10 flex-1">
                      <div className="flex flex-col gap-4">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Original
                        </span>
                        <div className="relative aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 group">
                          <img src={result.originalUrl} alt="Original" className="w-full h-full object-contain p-4" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <span className="text-sm font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Transparent Result
                        </span>
                        <div 
                          className="relative aspect-square rounded-3xl overflow-hidden border-4 border-indigo-100 shadow-xl"
                          style={{
                            backgroundImage: 'repeating-conic-gradient(#f8fafc 0% 25%, #fff 0% 50%)',
                            backgroundSize: '24px 24px'
                          }}
                        >
                          <img src={result.resultUrl} alt="Result" className="w-full h-full object-contain p-4 drop-shadow-2xl" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-slate-100">
                      <button 
                        onClick={reset}
                        className="flex items-center gap-3 text-slate-400 hover:text-slate-800 transition-colors font-bold group"
                      >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                        Start Over
                      </button>

                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button 
                          onClick={reset}
                          className="flex-1 sm:flex-none px-8 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                        >
                          Discard
                        </button>
                        <button 
                          onClick={downloadResult}
                          className="flex-1 sm:flex-none px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          <Download className="w-6 h-6" />
                          Download PNG
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section id="how-to" className="py-24 border-t border-slate-100 scroll-mt-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">How to Use MagicBG</h2>
                <p className="text-slate-600">Three simple steps to professional transparency.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-12">
                {[
                  { icon: <Upload className="w-8 h-8 text-indigo-600" />, title: "1. Upload", text: "Drag your photo into the box or select it from your device. We support all major formats." },
                  { icon: <Loader2 className="w-8 h-8 text-indigo-600 animate-spin-slow" />, title: "2. Wait 5 Seconds", text: "Our on-device AI analyzes your photo to separate the foreground from the background automatically." },
                  { icon: <Download className="w-8 h-8 text-indigo-600" />, title: "3. Download", text: "Review the results and download your high-quality transparent PNG file instantly." }
                ].map((step, i) => (
                  <div key={i} className="bg-slate-50 p-10 rounded-[2rem] text-center border border-slate-100/50">
                    <div className="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                      {step.icon}
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h4>
                    <p className="text-slate-600 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="about" className="py-24 bg-indigo-900 -mx-4 px-4 md:-mx-12 md:px-12 text-white rounded-[3rem] my-12 shadow-2xl shadow-indigo-200 overflow-hidden relative scroll-mt-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-700 rounded-full -ml-32 -mb-32 blur-3xl opacity-50"></div>
              
              <div className="relative z-10 max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-8">Built for Privacy & Speed</h2>
                <p className="text-lg text-indigo-100 mb-16 leading-relaxed">
                  MagicBG uses cutting-edge Machine Learning (TFLite/WASM) to process your images directly in your browser. 
                  Unlike other tools, your personal photos are never uploaded to a server.
                </p>
                
                <div className="grid md:grid-cols-3 gap-10">
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 mb-4 text-indigo-300" />
                    <h5 className="font-bold text-xl mb-2">100% Private</h5>
                    <p className="text-sm text-indigo-200">No server uploads. Data never leaves your device.</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Zap className="w-12 h-12 mb-4 text-indigo-300" />
                    <h5 className="font-bold text-xl mb-2">Instant Result</h5>
                    <p className="text-sm text-indigo-200">Processing happens locally in real-time.</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Globe className="w-12 h-12 mb-4 text-indigo-300" />
                    <h5 className="font-bold text-xl mb-2">Offline Capability</h5>
                    <p className="text-sm text-indigo-200">Works even when you're disconnected.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="faq" className="py-24 max-w-3xl mx-auto scroll-mt-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-slate-600">Everything you need to know about MagicBG.</p>
              </div>
              <div className="space-y-2">
                <FAQItem 
                  question="Is MagicBG really free?" 
                  answer="Yes, it is completely free to use. Because the processing happens on your computer rather than our servers, we don't have high server costs to pass on to you." 
                />
                <FAQItem 
                  question="What happens to my uploaded photos?" 
                  answer="Nothing! Your photos are not actually 'uploaded'. They are loaded into your browser's memory and processed by an AI model running locally on your CPU/GPU." 
                />
                <FAQItem 
                  question="Why did the first image take longer to process?" 
                  answer="The first time you use the tool, your browser needs to download the AI weights (roughly 70MB). These are cached so subsequent uses are much faster." 
                />
                <FAQItem 
                  question="What are the supported image types?" 
                  answer="We currently support JPG, PNG, and WebP files. For best results, ensure your subject is clearly defined from the background." 
                />
                <FAQItem 
                  question="Is there a limit to image resolution?" 
                  answer="While we don't hard-cap resolution, images over 4000px may cause your browser to slow down or run out of memory. We recommend standard web resolutions for the best experience." 
                />
              </div>
            </section>
          </div>
        )}

        {currentPage === 'privacy' && (
          <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
            <button 
              onClick={() => handleNavigation('home')}
              className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:translate-x-1 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
            <div className="prose prose-slate lg:prose-lg max-w-none text-slate-600 space-y-6">
              <p className="text-lg font-medium text-slate-800">Effective Date: October 2024</p>
              <p>
                At MagicBG, we believe that your data is yours alone. Our "Privacy by Design" architecture ensures that your images are processed entirely within your browser environment.
              </p>
              <h3 className="text-xl font-bold text-slate-900">1. Data Processing</h3>
              <p>
                MagicBG uses Client-Side Artificial Intelligence. This means when you upload an image, it is loaded into your device's RAM (Random Access Memory). The AI model, running via WebAssembly (WASM) in your browser, processes the pixels locally. **No image data is ever transmitted to our servers or any third-party cloud service.**
              </p>
              <h3 className="text-xl font-bold text-slate-900">2. Information Collection</h3>
              <p>
                We do not collect personal identifiers, email addresses, or account information. We do not use tracking cookies that identify individuals. 
              </p>
              <h3 className="text-xl font-bold text-slate-900">3. Local Storage</h3>
              <p>
                Our application may use your browser's local storage or Cache API solely to store the AI model weights. This is done to improve performance and allow the tool to work faster on subsequent visits.
              </p>
              <h3 className="text-xl font-bold text-slate-900">4. Third-Party Libraries</h3>
              <p>
                We utilize the <code>@imgly/background-removal</code> library. This library is designed for client-side execution and adheres to the same local-processing principles.
              </p>
              <h3 className="text-xl font-bold text-slate-900">5. Contact Us</h3>
              <p>
                If you have questions about our privacy practices, please contact us via our partner portal at SecureCheckAI.online.
              </p>
            </div>
          </div>
        )}

        {currentPage === 'terms' && (
          <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4">
            <button 
              onClick={() => handleNavigation('home')}
              className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:translate-x-1 transition-transform"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <h1 className="text-4xl font-black text-slate-900 mb-8">Terms of Service</h1>
            <div className="prose prose-slate lg:prose-lg max-w-none text-slate-600 space-y-6">
              <h3 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h3>
              <p>
                By using MagicBG, you agree to comply with these terms. This service is provided "as-is" for personal and commercial use.
              </p>
              <h3 className="text-xl font-bold text-slate-900">2. Usage Rights</h3>
              <p>
                You retain full ownership and copyright of any images you process using MagicBG. We do not claim any rights to the outputs generated by the tool.
              </p>
              <h3 className="text-xl font-bold text-slate-900">3. Prohibited Conduct</h3>
              <p>
                You agree not to use the service for any illegal purposes or to process content that violates the rights of others. Since processing is local, you are solely responsible for the content you handle.
              </p>
              <h3 className="text-xl font-bold text-slate-900">4. Limitation of Liability</h3>
              <p>
                MagicBG and its partners (including SecureCheckAI.online) shall not be liable for any damages resulting from the use or inability to use the service, including browser crashes or performance issues related to local AI processing.
              </p>
              <h3 className="text-xl font-bold text-slate-900">5. Changes to Service</h3>
              <p>
                We reserve the right to modify or discontinue the service at any time without notice, though our commitment to your privacy will remain constant.
              </p>
            </div>
          </div>
        )}

        {currentPage === 'contact' && (
          <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 text-center">
            <button 
              onClick={() => handleNavigation('home')}
              className="flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:translate-x-1 transition-transform mx-auto"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Mail className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-4">Get in Touch</h1>
            <p className="text-xl text-slate-600 mb-12 max-w-lg mx-auto">
              Have feedback, bug reports, or partnership inquiries? We'd love to hear from you.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-indigo-50">
                <h4 className="font-bold text-slate-900 mb-2">Support Email</h4>
                <p className="text-indigo-600 font-medium select-all">support@securecheckai.online</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-indigo-50">
                <h4 className="font-bold text-slate-900 mb-2">Partner Site</h4>
                <a href="https://securecheckai.online" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium hover:underline">
                  securecheckai.online
                </a>
              </div>
            </div>
            
            <div className="mt-16 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Corporate Inquiries</h3>
              <p className="text-slate-600">
                For bulk processing solutions or API integration discussions, please reach out via our corporate contact form on our partner portal.
              </p>
            </div>
          </div>
        )}

        {/* Final CTA (Always visible on Home) */}
        {currentPage === 'home' && (
          <section className="py-12 bg-indigo-50 rounded-[2.5rem] text-center border border-indigo-100 flex flex-col items-center gap-6 mt-12">
            <Info className="w-12 h-12 text-indigo-600" />
            <h3 className="text-2xl font-bold text-slate-900">Ready to transform your images?</h3>
            <p className="text-slate-600 max-w-md">Join thousands of creators using MagicBG for their daily design workflows.</p>
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                fileInputRef.current?.click();
              }}
              className="px-8 py-4 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              Start Background Removal
            </button>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div 
                className="flex items-center gap-2 mb-6 text-white cursor-pointer inline-flex"
                onClick={() => handleNavigation('home')}
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">MagicBG</span>
              </div>
              <p className="max-w-xs leading-relaxed text-sm">
                MagicBG is a privacy-focused AI tool designed for designers, marketers, and creators who need fast background removal without compromising their data.
              </p>
            </div>
            <div>
              <h6 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Navigation</h6>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => handleNavigation('home')} className="hover:text-indigo-400 text-left">Home</button></li>
                <li><button onClick={() => handleNavigation('home', 'about')} className="hover:text-indigo-400 text-left">About AI</button></li>
                <li><button onClick={() => handleNavigation('contact')} className="hover:text-indigo-400 text-left">Support</button></li>
              </ul>
            </div>
            <div>
              <h6 className="text-white font-bold mb-6 uppercase tracking-wider text-xs">Legal & Trust</h6>
              <ul className="space-y-4 text-sm">
                <li><button onClick={() => handleNavigation('privacy')} className="hover:text-indigo-400 text-left">Privacy Policy</button></li>
                <li><button onClick={() => handleNavigation('terms')} className="hover:text-indigo-400 text-left">Terms of Service</button></li>
                <li><button onClick={() => handleNavigation('contact')} className="hover:text-indigo-400 text-left">Contact Us</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-xs flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2024 MagicBG AI. All processing done 100% Client-Side.</p>
            <div className="flex gap-6">
              <a href="https://securecheckai.online" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                SecureCheckAI.online Partner
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
