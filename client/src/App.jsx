// client/src/App.jsx

import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute'; // <--- NOUVEL IMPORT

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          {/* 🌟 LA HOME PAGE EST MAINTENANT PROTÉGÉE 🌟 */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          {/* La page d'auth reste publique */}
          <Route path="/auth" element={<LoginPage />} /> 
        </Routes>
      </main>
    </div>
  )
}

export default App;