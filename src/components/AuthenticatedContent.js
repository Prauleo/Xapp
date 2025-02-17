"use client";

import { useAuth } from './AuthProvider';
import Auth from './Auth';
import CuentasList from './CuentasList';
import FloatingButton from './FloatingButton';
export default function AuthenticatedContent() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="relative">
        <div className="absolute top-0 left-0 p-4 z-50">
          <button
            onClick={signOut}
            className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors"
            title="Logout"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
        <CuentasList />
        <FloatingButton />
      </div>
    </div>
  );
}
