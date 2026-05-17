import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

export default function Error403() {
  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center px-6 relative">
      <ParticleBackground />
      <motion.div className="text-center z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div
          className="w-24 h-24 rounded-3xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield className="w-12 h-12 text-red-400" />
        </motion.div>
        <h1 className="text-8xl font-black gradient-text mb-4">403</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
        <p className="text-white/40 mb-10 max-w-sm">
          You don't have permission to access this resource. This incident has been logged.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard" className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link to="/" className="btn-secondary">Home</Link>
        </div>
      </motion.div>
    </div>
  );
}
