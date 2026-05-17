import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

export default function Error404() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-6 relative">
      <ParticleBackground />
      <motion.div className="text-center z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div
          className="w-24 h-24 rounded-3xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mx-auto mb-8"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Compass className="w-12 h-12 text-neon-blue" />
        </motion.div>
        <h1 className="text-8xl font-black gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-white/40 mb-10 max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link to="/" className="btn-primary">Home</Link>
        </div>
      </motion.div>
    </div>
  );
}
