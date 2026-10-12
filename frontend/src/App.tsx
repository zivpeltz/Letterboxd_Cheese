import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QuickLogModal } from './components/QuickLogModal';
import { AuthModal } from './components/AuthModal';

import { HomePage } from './pages/HomePage';
import { CheesesPage } from './pages/CheesesPage';
import { CheeseDetailPage } from './pages/CheeseDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ListsPage } from './pages/ListsPage';
import { MembersPage } from './pages/MembersPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cheeses" element={<CheesesPage />} />
              <Route path="/cheeses/:slug" element={<CheeseDetailPage />} />
              <Route path="/users/:username" element={<ProfilePage />} />
              <Route path="/lists" element={<ListsPage />} />
              <Route path="/lists/:id" element={<ListsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />

          {/* Global Modals */}
          <QuickLogModal />
          <AuthModal />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
