import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E2A3A',
            color: '#E2E8F0',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            backdropFilter: 'blur(12px)',
          },
          success: {
            iconTheme: { primary: '#00D4FF', secondary: '#0B1020' },
          },
          error: {
            iconTheme: { primary: '#FF4DFF', secondary: '#0B1020' },
          },
          duration: 4000,
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
