import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles, X, Upload, User, CheckCircle2, Eye } from 'lucide-react';
import { SmartSwatch } from '../shared/SmartSwatch';

interface Variation {
  image: string;
  tryon_image?: string;
  details: {
    title: string;
    fabric: string;
    silhouette: string;
    details: string;
    styling: string;
  };
}

export function IdeaStudio() {
  const [prompt, setPrompt] = useState('');
  const [gender, setGender] = useState<'women' | 'men' | 'unisex'>('women');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  
  // Custom person / model upload states
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [personPreview, setPersonPreview] = useState<string | null>(null);
  const [uploadedPersonUrl, setUploadedPersonUrl] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'tryon' | 'garment' | 'compare'>('tryon');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPlaceholder = () => {
    if (gender === 'men') {
      return "e.g., A sharp tailored wool blazer in charcoal grey with double-breasted closure...";
    }
    if (gender === 'unisex') {
      return "e.g., An oversized tech-wear trench coat in obsidian black with modular pockets...";
    }
    return "e.g., A minimalist silk slip dress in deep emerald with asymmetric draping...";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPersonFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPersonPreview(objectUrl);
    }
  };

  const removePersonPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPersonFile(null);
    if (personPreview) {
      URL.revokeObjectURL(personPreview);
      setPersonPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setEnhancedPrompt('');
    
    try {
      let response: Response;

      if (personFile) {
        // Send multipart form data with the user's uploaded photo
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('gender', gender);
        formData.append('person_image', personFile);

        response = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Standard JSON request
        response = await fetch('http://localhost:8000/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, gender }),
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        setVariations((data.variations || []).slice(0, 4));
        setEnhancedPrompt(data.enhanced_prompt);
        setExtractedColors(data.colors || ['#1A1A1A', '#FAFAFA', '#D4AF37', '#4A4A4A', '#8B0000']);
        if (data.person_image) {
          setUploadedPersonUrl(data.person_image);
        }
      }
    } catch (error) {
      console.error('Error generating designs:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
      {/* Left side - Prompt & Model Input */}
      <div className="w-full md:w-1/3">
        <div className="sticky top-8">
          <h2 className="text-2xl font-serif mb-2">Creative Studio</h2>
          <p className="text-sm text-gray-500 mb-6 font-light">
            Upload your photo or use AI models to render bespoke fashion concepts directly onto you.
          </p>

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Target Collection Gender */}
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-gray-400 font-medium block">
                Target Collection
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['women', 'men', 'unisex'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-3 border rounded-sm text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer ${
                      gender === g
                        ? 'border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)] font-medium shadow-sm'
                        : 'border-[var(--border-color)] text-gray-400 hover:border-gray-500 hover:text-[var(--text-color)]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Person / Face / Body Upload Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs tracking-widest uppercase text-gray-400 font-medium flex items-center gap-1.5">
                  <User size={13} className="text-[var(--color-vogue-accent)]" />
                  Your Photo / Model Fitting
                </label>
                {personPreview && (
                  <span className="text-[11px] text-[var(--color-vogue-accent)] font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} /> Active
                  </span>
                )}
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileChange}
              />

              {personPreview ? (
                <div className="relative group border border-[var(--color-vogue-accent)] rounded-sm p-3 bg-[var(--card-bg)] flex items-center gap-3">
                  <img 
                    src={personPreview} 
                    alt="Uploaded Model" 
                    className="w-14 h-16 object-cover rounded-sm border border-[var(--border-color)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--text-color)] truncate">
                      {personFile?.name || "Uploaded Photo"}
                    </p>
                    <p className="text-[11px] text-gray-400 font-light mt-0.5">
                      Designs will be custom fitted to this photo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removePersonPhoto}
                    className="p-1.5 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    title="Remove Photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[var(--border-color)] hover:border-[var(--color-vogue-accent)] rounded-sm p-4 text-center cursor-pointer transition-colors bg-[var(--card-bg)]/50 group"
                >
                  <Upload size={18} className="mx-auto mb-2 text-gray-400 group-hover:text-[var(--color-vogue-accent)] transition-colors" />
                  <p className="text-xs font-medium text-[var(--text-color)]">
                    Upload Your Face / Body Photo
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Click to browse JPG, PNG, or WEBP (Optional)
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-gray-400 font-medium block">
                Design Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isGenerating && prompt.trim()) {
                      handleGenerate();
                    }
                  }
                }}
                placeholder={getPlaceholder()}
                className="w-full h-32 bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-sm focus:outline-none focus:border-[var(--color-vogue-accent)] transition-colors resize-none shadow-sm text-sm"
              />
            </div>
            
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-[var(--text-color)] text-[var(--bg-color)] py-4 rounded-sm tracking-widest uppercase text-sm flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{personFile ? "Fitting & Rendering..." : "Drafting..."}</span>
                </>
              ) : (
                <>
                  <span>{personFile ? "Generate Fitted Concepts" : "Generate Concepts"}</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>

          {extractedColors.length > 0 && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10"
            >
              <h3 className="text-xs tracking-widest uppercase text-gray-400 mb-3">Extracted Palette</h3>
              <SmartSwatch colors={extractedColors} />
            </motion.div>
          )}

          {enhancedPrompt && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-[var(--card-bg)] border border-[var(--color-vogue-accent)] rounded-sm"
            >
              <h3 className="text-xs tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--color-vogue-accent)]" />
                Editorial Vision
              </h3>
              <p className="text-xs font-light text-gray-300 leading-relaxed italic">
                {enhancedPrompt}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right side - Generated Variations */}
      <div className="w-full md:w-2/3">
        {isGenerating ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-sm shimmer flex items-center justify-center text-xs text-gray-500">
                Fitting Var {i}...
              </div>
            ))}
          </div>
        ) : variations.length > 0 ? (
          <div>
            {uploadedPersonUrl && (
              <div className="mb-4 flex items-center justify-between p-3 border border-[var(--border-color)] bg-[var(--card-bg)]/40 rounded-sm">
                <div className="flex items-center gap-3">
                  <img 
                    src={uploadedPersonUrl} 
                    alt="Active Model" 
                    className="w-10 h-10 object-cover rounded-sm border border-[var(--color-vogue-accent)]" 
                  />
                  <div>
                    <span className="text-xs font-serif font-medium text-[var(--color-vogue-accent)]">
                      Bespoke Virtual Try-On Applied
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Garments designed and proportioned to match your uploaded portrait.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {variations.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative group cursor-pointer overflow-hidden rounded-sm border border-[var(--border-color)] bg-[rgba(255,255,255,0.05)] backdrop-blur-lg"
                  onClick={() => {
                    setSelectedVariation(v);
                    setActiveModalTab(v.tryon_image ? 'tryon' : 'garment');
                  }}
                >
                  <img 
                    src={v.tryon_image || v.image} 
                    alt={v.details?.title || `Variation ${i + 1}`} 
                    className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Subtle badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {v.tryon_image && (
                      <span className="bg-black/75 backdrop-blur border border-[var(--color-vogue-accent)] text-[var(--color-vogue-accent)] text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                        Virtual Try-On
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-black text-[11px] font-bold px-2 py-0.5 rounded-sm shadow-sm">
                    Var {i + 1}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xs font-serif text-white tracking-wide truncate">{v.details?.title}</h4>
                    <p className="text-[11px] text-gray-300 font-light truncate mt-0.5">{v.details?.fabric}</p>
                    <span className="text-[10px] text-[var(--color-vogue-accent)] mt-1 flex items-center gap-1 font-medium">
                      <Eye size={11} /> Click to inspect fitting & specs
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[550px] border border-dashed border-[var(--border-color)] rounded-sm flex items-center justify-center flex-col text-gray-400 p-8 text-center">
            <Sparkles size={36} className="mb-4 text-[var(--color-vogue-accent)] opacity-60" />
            <p className="font-serif text-xl mb-2 text-[var(--text-color)]">Bespoke Design & Try-On Studio</p>
            <p className="text-xs text-gray-400 max-w-md font-light leading-relaxed">
              Describe a garment concept on the left, optionally upload your photo, and Loom & Logic will tailor 4 distinct visual directions directly onto your aesthetic.
            </p>
          </div>
        )}
      </div>

      {/* Detail & Virtual Fitting Modal */}
      {selectedVariation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-6 overflow-y-auto"
          onClick={() => setSelectedVariation(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50 bg-black/60 p-2 rounded-full cursor-pointer"
            onClick={() => setSelectedVariation(null)}
          >
            <X size={26} />
          </button>
          
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-sm max-w-5xl w-full flex flex-col md:flex-row overflow-hidden shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: Interactive Image View with Tabs */}
            <div className="md:w-3/5 bg-black/40 flex flex-col items-center justify-between p-4 relative min-h-[420px] md:max-h-[85vh]">
              {/* Tab Selector if tryon_image exists */}
              {selectedVariation.tryon_image && (
                <div className="w-full flex justify-center mb-3">
                  <div className="inline-flex bg-black/60 border border-[var(--border-color)] rounded-sm p-1 gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('tryon')}
                      className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                        activeModalTab === 'tryon'
                          ? 'bg-[var(--color-vogue-accent)] text-black font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Bespoke Try-On
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('garment')}
                      className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                        activeModalTab === 'garment'
                          ? 'bg-[var(--color-vogue-accent)] text-black font-semibold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Garment Only
                    </button>
                    {(uploadedPersonUrl || personPreview) && (
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('compare')}
                        className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                          activeModalTab === 'compare'
                            ? 'bg-[var(--color-vogue-accent)] text-black font-semibold'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Model Reference
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Main Display Image */}
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                {activeModalTab === 'tryon' && selectedVariation.tryon_image ? (
                  <img 
                    src={selectedVariation.tryon_image} 
                    alt="Virtual Try-On" 
                    className="max-h-[65vh] w-auto object-contain rounded-sm shadow-lg"
                  />
                ) : activeModalTab === 'compare' && (uploadedPersonUrl || personPreview) ? (
                  <div className="flex gap-4 items-center justify-center max-h-[65vh]">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] tracking-widest text-gray-400 mb-1">YOUR PHOTO</span>
                      <img 
                        src={uploadedPersonUrl || personPreview || ''} 
                        alt="Your Photo" 
                        className="max-h-[55vh] w-auto object-contain rounded-sm border border-[var(--border-color)]"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] tracking-widest text-[var(--color-vogue-accent)] mb-1">TAILORED DRESS</span>
                      <img 
                        src={selectedVariation.image} 
                        alt="Garment" 
                        className="max-h-[55vh] w-auto object-contain rounded-sm border border-[var(--color-vogue-accent)]"
                      />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={selectedVariation.image} 
                    alt={selectedVariation.details?.title} 
                    className="max-h-[65vh] w-auto object-contain rounded-sm shadow-lg"
                  />
                )}
              </div>
            </div>
            
            {/* Right side: Detailed Specs Panel */}
            <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] border-t md:border-t-0 md:border-l border-[var(--border-color)]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-widest uppercase text-[var(--color-vogue-accent)] font-semibold block">
                    Garment Specs & Fitting
                  </span>
                  {selectedVariation.tryon_image && (
                    <span className="text-[10px] text-green-400 font-mono bg-green-950/40 px-2 py-0.5 rounded-sm border border-green-800/40">
                      ✓ Fitted to You
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-serif tracking-wide mb-6 border-b border-[var(--border-color)] pb-3">
                  {selectedVariation.details?.title}
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1">Fabric & Texture</h4>
                    <p className="text-sm font-light text-gray-200 leading-relaxed">{selectedVariation.details?.fabric}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1">Silhouette & Cut</h4>
                    <p className="text-sm font-light text-gray-200 leading-relaxed">{selectedVariation.details?.silhouette}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1">Embellishments & Seams</h4>
                    <p className="text-sm font-light text-gray-200 leading-relaxed">{selectedVariation.details?.details}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1">Styling & Pairings</h4>
                    <p className="text-sm font-light italic text-gray-300 leading-relaxed">{selectedVariation.details?.styling}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-5 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-xs text-gray-400">Ready for Production</span>
                <button 
                  className="px-5 py-2 border border-[var(--text-color)] text-xs tracking-widest uppercase hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-colors rounded-sm cursor-pointer"
                  onClick={() => setSelectedVariation(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
