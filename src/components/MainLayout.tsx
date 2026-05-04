"use client";

import React from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans text-[#101828]">
      {children}
    </div>
  );
}
