import React, { useState } from 'react';

function App() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Blockit</h1>
              <p className="text-sm text-gray-500">Token Approval Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              App Loaded Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Blockit is ready to scan token approvals on Base network.
            </p>
            <div className="text-sm text-gray-500">
              React app is working properly! 🚀
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Connection Test</h3>
          
          <button
            onClick={() => {
              setIsConnected(!isConnected);
              alert('🎉 Button clicked! React state working.');
            }}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
              isConnected 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isConnected ? '✅ Connected' : '🔗 Test Connection'}
          </button>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Built for Base Network • Powered by Farcaster
        </div>
      </div>
    </div>
  );
}

export default App;
