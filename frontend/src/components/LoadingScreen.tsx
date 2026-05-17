import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="relative w-20 h-20 mx-auto mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer ring */}
          <svg className="w-20 h-20 absolute inset-0" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="rgba(0,212,255,0.15)"
              strokeWidth="2"
            />
            <motion.circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="213.6"
              strokeDashoffset="160"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '40px 40px' }}
            />
          </svg>
          {/* Inner ring */}
          <svg className="w-10 h-10 absolute top-5 left-5" viewBox="0 0 40 40">
            <motion.circle
              cx="20" cy="20" r="14"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="87.9"
              strokeDashoffset="65"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '20px 20px' }}
            />
          </svg>
          {/* Center dot */}
          <motion.div
            className="w-3 h-3 rounded-full bg-neon-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-2xl font-bold gradient-text">SkillForge</span>
          <p className="text-white/40 text-sm mt-2 font-mono">Initializing AI Engine...</p>
        </motion.div>

        {/* Progress dots */}
        <div className="flex gap-2 justify-center mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-neon-blue"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
