
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Wand2, Zap, Download, RefreshCw, Sliders, Info } from 'lucide-react';

interface BackgroundRemoverProps {
  file: File;
  onResult: (resultUrl: string) => void;
  onError: (error: string) => void;
}

const BackgroundRemover: React.FC<BackgroundRemoverProps> = ({ file, onResult, onError }) => {
  const [tolerance, setTolerance] = useState(30);
  const [feather, setFeather] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Instant Canvas-based background removal (Color-key thresholding)
  const processInstant = (img: HTMLImageElement, tol: number, fth: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. Sample corners to guess background color
    const corners = [
      [0, 0],
      [canvas.width - 1, 0],
      [0, canvas.height - 1],
      [canvas.width - 1, canvas.height - 1]
    ];

    let rSum = 0, gSum = 0, bSum = 0;
    corners.forEach(([x, y]) => {
      const idx = (y * canvas.width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
    });

    const bgR = rSum / 4;
    const bgG = gSum / 4;
    const bgB = bSum / 4;

    // 2. Thresholding logic (Euclidean distance in RGB space)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = Math.sqrt(
        Math.pow(r - bgR, 2) +
        Math.pow(g - bgG, 2) +
        Math.pow(b - bgB, 2)
      );

      if (dist < tol) {
        // Smooth transition (feathering)
        const alpha = Math.max(0, Math.min(255, (dist / tol) * 255 * (1 / (fth || 1))));
        data[i + 3] = dist < tol / 1.5 ? 0 : alpha;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    onResult(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        processInstant(img, tolerance, feather);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Handle adjustments
  useEffect(() => {
    if (originalImageRef.current) {
      processInstant(originalImageRef.current, tolerance, feather);
    }
  }, [tolerance, feather]);

  return (
    <div className="w-full space-y-6">
      <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}> <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}> Free AI Background Remover </h1> <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}> Remove image backgrounds instantly with our professional AI tool. High-quality transparent PNGs for TikTok Shop, E-commerce products, and social media in just one click. 100% Free & Fast. </p> </div>
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 leading-tight">Instant Express Mode</h4>
            <p className="text-xs text-slate-500">Processing locally in &lt;100ms</p>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-1 max-w-md">
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Tolerance</span>
              <span>{tolerance}</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="150" 
              value={tolerance} 
              onChange={(e) => setTolerance(parseInt(e.target.value))}
              className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Edge Feather</span>
              <span>{feather}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5"
              value={feather} 
              onChange={(e) => setFeather(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-sm text-amber-800">
        <Info className="w-5 h-5 flex-shrink-0" />
        <p>
          <b>Express Mode</b> works best on photos with solid or simple backgrounds. Use the sliders above to fine-tune the result instantly.
        </p>
      </div>
    </div>
  );
};

export default BackgroundRemover;
