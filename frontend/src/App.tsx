import { useState } from 'react';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard'>('upload');
  const [currentTable, setCurrentTable] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-blue-400">SmartDash</h1>
          <p className="text-gray-500 text-sm">AI SQL Dashboard</p>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 ${activeTab === 'upload' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            📤 Upload Data
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            📊 Dashboard
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'upload' ? (
          <UploadPage onTableLoaded={setCurrentTable} setActiveTab={setActiveTab} />
        ) : (
          <Dashboard currentTable={currentTable} />
        )}
      </div>
    </div>
  );
}

export default App;