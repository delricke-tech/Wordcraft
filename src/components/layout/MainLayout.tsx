import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickActionsMenu } from '../QuickActionsMenu';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={`transition-all duration-300 w-full ${
          // Sur mobile, pas de marge (sidebar en overlay)
          // Sur desktop, marge selon l'état collapsed
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        }`}
      >
        <Header />
        <main className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      
      {/* ✅ Menu d'actions rapides flottant (style WhatsApp) */}
      <QuickActionsMenu />
    </div>
  );
}
