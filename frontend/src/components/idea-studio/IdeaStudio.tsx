import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles, X } from 'lucide-react';
import { SmartSwatch } from '../shared/SmartSwatch';

interface Variation {
  image: string;
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

  const getPlaceholder = () => {
    if (gender === 'men') {
      return "e.g., A sharp tailored wool blazer in charcoal grey with double-breasted closure...";
    }
    if (gender === 'unisex') {
      return "e.g., An oversized tech-wear trench coat in obsidian black with modular pockets...";
    }
    return "e.g., A minimalist silk slip dress in deep emerald with asymmetric draping...";
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setEnhancedPrompt('');
    
    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, gender }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setVariations((data.variations || []).slice(0, 4));
        setEnhancedPrompt(data.enhanced_prompt);
        setExtractedColors(data.colors || ['#1A1A1A', '#FAFAFA', '#D4AF37', '#4A4A4A', '#8B0000']);
      }
    } catch (error) {
      console.error('Error generating designs:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
      {/* Left side - Prompt Input */}
      <div className="w-full md:w-1/3">
        <div className="sticky top-8">
          <h2 className="text-2xl font-serif mb-6">Creative Prompt</h2>
          <p className="text-sm text-gray-500 mb-8 font-light">
            Describe your vision. Include fabrics, silhouettes, and mood.
          </p>

          <form onSubmit={handleGenerate} className="space-y-6">
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
                    className={`py-2.5 px-3 border rounded-sm text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer ${
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
              className="w-full h-40 bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-sm focus:outline-none focus:border-[var(--color-vogue-accent)] transition-colors resize-none shadow-sm"
            />
            
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-[var(--text-color)] text-[var(--bg-color)] py-4 rounded-sm tracking-widest uppercase text-sm flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Drafting...</span>
                </>
              ) : (
                <>
                  <span>Generate Concepts</span>
                  <Send size={18} />
                </>
              )}
            </button>
          </form>

          {extractedColors.length > 0 && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <h3 className="text-sm tracking-widest uppercase text-gray-400 mb-4">Extracted Palette</h3>
              <SmartSwatch colors={extractedColors} />
            </motion.div>
          )}

          {enhancedPrompt && !isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-[var(--card-bg)] border border-[var(--color-vogue-accent)] rounded-sm"
            >
              <h3 className="text-sm tracking-widest uppercase text-gray-400 mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--color-vogue-accent)]" />
                AI Enhanced Vision
              </h3>
              <p className="text-sm font-light text-gray-300 leading-relaxed italic">
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
              <div key={i} className="aspect-[3/4] rounded-sm shimmer"></div>
            ))}
          </div>
        ) : variations.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {variations.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group cursor-pointer overflow-hidden rounded-sm border border-[var(--border-color)] bg-[rgba(255,255,255,0.1)] backdrop-blur-lg"
                onClick={() => setSelectedVariation(v)}
              >
                <img 
                  src={v.image} 
                  alt={v.details?.title || `Variation ${i + 1}`} 
                  className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h4 className="text-sm font-serif text-white tracking-wide">{v.details?.title}</h4>
                  <p className="text-xs text-gray-300 font-light truncate mt-1">{v.details?.fabric}</p>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-black text-xs font-bold px-3 py-1 rounded-sm shadow-sm">
                  Var ${i + 1}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full min-h-[600px] border border-dashed border-[var(--border-color)] rounded-sm flex items-center justify-center flex-col text-gray-400">
            <Sparkles size={32} className="mb-4 opacity-50" />
            <p className="font-serif text-lg">Your vision will appear here</p>
          </div>
        )}
      </div>

      {selectedVariation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6 overflow-y-auto"
          onClick={() => setSelectedVariation(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-50 bg-black/50 p-2 rounded-full animate-fadeIn"
            onClick={() => setSelectedVariation(null)}
          >
            <X size={28} />
          </button>
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-sm max-w-5xl w-full flex flex-col md:flex-row overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
          >
            {/* Left side: Image */}
            <div className="md:w-3/5 bg-black/20 flex items-center justify-center relative aspect-[3/4] md:aspect-auto md:max-h-[80vh]">
              <img 
                src={selectedVariation.image} 
                alt={selectedVariation.details?.title} 
                className="w-full h-full object-cover md:object-contain max-h-[80vh]"
              />
            </div>
            
            {/* Right side: Detailed Specs Panel */}
            <div className="md:w-2/5 p-8 flex flex-col justify-between overflow-y-auto max-h-[80vh] border-t md:border-t-0 md:border-l border-[var(--border-color)]">
              <div>
                <span className="text-[10px] tracking-widest uppercase text-[var(--color-vogue-accent)] font-semibold mb-2 block">
                  Design Specifications
                </span>
                <h3 className="text-3xl font-serif tracking-wide mb-6 border-b border-[var(--border-color)] pb-4">
                  {selectedVariation.details?.title}
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1.5">Fabric & Materials</h4>
                    <p className="text-sm font-light text-gray-200 leading-relaxed">{selectedVariation.details?.fabric}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1.5">Silhouette & Drape</h4>
                    <p className="text-sm font-light text-gray-200 leading-relaxed">{selectedVariation.details?.silhouette}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1.5">Key Embellishments</h4>
                    <p className="text-sm font-light text-gray-200 leading-relaxed">{selectedVariation.details?.details}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs tracking-widest uppercase text-gray-400 font-medium mb-1.5">Styling Recommendations</h4>
                    <p className="text-sm font-light italic text-gray-300 leading-relaxed">{selectedVariation.details?.styling}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-xs text-gray-400">Concept Active</span>
                <button 
                  className="px-6 py-2 border border-[var(--text-color)] text-xs tracking-widest uppercase hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-colors rounded-sm"
                  onClick={() => setSelectedVariation(null)}
                >
                  Close Specs
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

