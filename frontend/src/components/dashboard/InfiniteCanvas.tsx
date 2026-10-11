import { motion } from 'framer-motion';
import { SmartSwatch } from '../shared/SmartSwatch';

const mockDesigns = [
  { id: 1, title: 'Ethereal Silk Gown', image: 'https://images.unsplash.com/photo-1566206091558-4f65527a6566?q=80&w=600&auto=format&fit=crop', tags: ['Silk', 'Evening', 'Draped'], colors: ['#D4AF37', '#111111', '#FAFAFA', '#8B0000', '#2F4F4F'] },
  { id: 2, title: 'Structured Linen Blazer', image: 'https://images.unsplash.com/photo-1591557303495-25c2826e7a68?q=80&w=600&auto=format&fit=crop', tags: ['Linen', 'Tailored', 'Outerwear'], colors: ['#C2B280', '#FAFAFA', '#111111', '#556B2F', '#A0522D'] },
  { id: 3, title: 'Avant-Garde Trench', image: 'https://images.unsplash.com/photo-1550614000-4b95d466ee1a?q=80&w=600&auto=format&fit=crop', tags: ['Cotton', 'Streetwear', 'Oversized'], colors: ['#2F4F4F', '#111111', '#8B4513', '#D3D3D3', '#000000'] },
  { id: 4, title: 'Minimalist Shift Dress', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop', tags: ['Wool', 'Daywear', 'Sleek'], colors: ['#FAFAFA', '#111111', '#A9A9A9', '#FFE4B5', '#800000'] },
];

export function InfiniteCanvas() {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
      {mockDesigns.map((design, index) => (
        <motion.div 
          key={design.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="break-inside-avoid relative group"
        >
          <div className="bg-[var(--card-bg)] shadow-[var(--card-shadow)] rounded-sm overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="relative overflow-hidden">
              <img 
                src={design.image} 
                alt={design.title} 
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button className="px-6 py-2 bg-white text-black text-sm tracking-widest uppercase rounded-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  View Technicals
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-serif mb-2">{design.title}</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {design.tags.map(tag => (
                  <span key={tag} className="text-xs tracking-wider uppercase text-gray-500 border border-[var(--border-color)] px-2 py-1 rounded-sm">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="border-t border-[var(--border-color)] pt-4">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Extracted Palette</p>
                <SmartSwatch colors={design.colors} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
