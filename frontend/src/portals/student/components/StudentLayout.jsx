import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const StudentLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content Area with left margin for fixed sidebar */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};
