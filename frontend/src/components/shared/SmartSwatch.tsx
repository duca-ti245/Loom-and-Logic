import { motion } from 'framer-motion';

interface SmartSwatchProps {
  colors: string[];
}

export function SmartSwatch({ colors }: SmartSwatchProps) {
  return (
    <div className="flex space-x-2">
      {colors.map((color, idx) => (
        <motion.div
          key={`${color}-${idx}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: idx * 0.1 }}
          className="w-8 h-8 rounded-full shadow-sm border border-gray-200 cursor-pointer transition-transform hover:scale-125"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
