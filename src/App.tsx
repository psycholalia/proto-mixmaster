import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Headphones, Disc3 } from 'lucide-react';
import Layout from './components/Layout';
import RemixStudio from './components/RemixStudio';
import TaskView from './components/TaskView';

function App() {
  return (
    <Router>
      <Layout>
        <header className="py-6 px-4 md:px-8 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Disc3 className="h-8 w-8 text-primary-400 animate-record-spin" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Mechanical-Legs
            </h1>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Routes>
              <Route path="/" element={
                <>
                  <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Transform Your Sound</h2>
                    <p className="text-white/70">
                      Upload your MP3 files and remix them in the iconic style of J Dilla - 
                      featuring offbeat rhythms, unique sampling techniques, and that signature 
                      loose, lo-fi feel that defined his sound.
                    </p>
                  </section>
                  <RemixStudio />
                </>
              } />
              <Route path="/task/:taskId" element={<TaskView />} />
            </Routes>
          </div>
        </main>
        
        <footer className="py-4 px-8 border-t border-white/10 text-center text-white/50 text-sm">
          <div className="flex items-center justify-center space-x-2">
            <Headphones className="h-4 w-4" />
            <span>Made with love for makers of all stripes</span>
          </div>
        </footer>
        
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e1e1e',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            duration: 5000,
          }}
        />
      </Layout>
    </Router>
  );
}

export default App;