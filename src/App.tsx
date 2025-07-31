import React, { useState, useEffect } from 'react';
import { Shield, Loader, Search, Network } from 'lucide-react';

// REAL wagmi imports for blockchain interaction
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// Farcaster SDK with error handling
let sdk: any = null;
try {
  sdk = require('@farcaster/miniapp-sdk').sdk;
} catch (error) {
  console.warn('Farcaster SDK not available:', error);
}

// Simple test component with explicit React import
function FixedBlockitApp(): React.JSX.Element {
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // REAL wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const addDebugInfo = (info: string) => {
    console.log('DEBUG:', info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      addDebugInfo('Starting app initialization...');
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        addDebugInfo('ERROR: Not in browser environment');
        return;
      }

      addDebugInfo('Browser environment detected');
      
      // Try to initialize Farcaster SDK
      if (sdk) {
        try {
          await sdk.actions.ready({
            disableNativeGestures: false
          });
          addDebugInfo('Farcaster SDK initialized successfully');
        } catch (sdkError: any) {
          addDebugInfo(`Farcaster SDK error: ${sdkError.message}`);
          // Continue anyway - app should work without SDK
        }
      } else {
        addDebugInfo('Farcaster SDK not available - continuing without it');
      }
      
      setSdkReady(true);
      addDebugInfo('App initialization complete');
      
    } catch (error: any) {
      addDebugInfo(`Initialization failed: ${error.message}`);
      setError(`Failed to initialize app: ${error.message}`);
      setSdkReady(true); // Set to true anyway to show the app
    }
  };

  const handleConnect = async () => {
    try {
      addDebugInfo('Attempting to connect wallet...');
      if (connectors.length > 0) {
        addDebugInfo(`Found ${connectors.length} connectors: ${connectors.map(c => c.name).join(', ')}`);
        await connect({ connector: connectors[0] });
        addDebugInfo('Wallet connection initiated');
      } else {
        addDebugInfo('No connectors found');
        setError('No wallet connectors available');
      }
    } catch (err: any) {
      addDebugInfo(`Connection error: ${err.message}`);
      setError(`Connection failed: ${err.message}`);
    }
  };

  const handleDisconnect = () => {
    addDebugInfo('Disconnecting wallet...');
    disconnect();
  };

  // Show loading state
  if (!sdkReady) {
    return React.createElement(
      'div',
      { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" },
      React.createElement(
        'div',
        { className: "text-center" },
        React.createElement(
          'div',
          { className: "w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4" },
          React.createElement(Shield, { className: "w-8 h-8 text-white" })
        ),
        React.createElement(Loader, { className: "w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" }),
        React.createElement('p', { className: "text-gray-600" }, 'Initializing Blockit...'),
        React.createElement('p', { className: "text-sm text-gray-500" }, 'Fixed Version')
      )
    );
  }

  return React.createElement(
    'div',
    { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" },
    // Header
    React.createElement(
      'div',
      { className: "bg-white border-b border-gray-200" },
      React.createElement(
        'div',
        { className: "max-w-md mx-auto px-4 py-4" },
        React.createElement(
          'div',
          { className: "flex items-center justify-between" },
          React.createElement(
            'div',
            { className: "flex items-center space-x-3" },
            React.createElement(
              'div',
              { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center" },
              React.createElement(Shield, { className: "w-6 h-6 text-white" })
            ),
            React.createElement(
              'div',
              null,
              React.createElement('h1', { className: "text-xl font-bold text-gray-900" }, 'Blockit Fixed'),
              React.createElement('p', { className: "text-sm text-gray-500" }, 'Testing Mode')
            )
          ),
          React.createElement(
            'div',
            { className: "flex items-center space-x-2" },
            React.createElement(
              'div',
              { className: "px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full" },
              'FIXED'
            ),
            React.createElement(
              'div',
              { className: "flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full" },
              React.createElement(Network, { className: "w-3 h-3" }),
              React.createElement('span', null, 'Base')
            )
          )
        )
      )
    ),
    // Main Content
    React.createElement(
      'div',
      { className: "max-w-md mx-auto px-4 py-6" },
      // Connection Status
      React.createElement(
        'div',
        { className: "bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6" },
        React.createElement('h3', { className: "font-semibold text-gray-900 mb-3" }, 'Connection Status'),
        React.createElement(
          'div',
          { className: "space-y-2 text-sm" },
          React.createElement(
            'div',
            { className: "flex justify-between" },
            React.createElement('span', null, 'Connected:'),
            React.createElement(
              'span',
              { className: isConnected ? 'text-green-600' : 'text-red-600' },
              isConnected ? 'Yes' : 'No'
            )
          ),
          React.createElement(
            'div',
            { className: "flex justify-between" },
            React.createElement('span', null, 'Address:'),
            React.createElement(
              'span',
              { className: "font-mono text-xs" },
              address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'
            )
          ),
          React.createElement(
            'div',
            { className: "flex justify-between" },
            React.createElement('span', null, 'Connectors:'),
            React.createElement('span', null, connectors.length)
          )
        )
      ),
      // Error Display
      error && React.createElement(
        'div',
        { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6" },
        React.createElement('h4', { className: "font-semibold text-red-800 mb-2" }, 'Error'),
        React.createElement('p', { className: "text-red-700 text-sm" }, error)
      ),
      // Main Content
      !isConnected ? React.createElement(
        'div',
        { className: "text-center space-y-6" },
        React.createElement(
          'div',
          { className: "w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto" },
          React.createElement(Search, { className: "w-10 h-10 text-white" })
        ),
        React.createElement(
          'div',
          null,
          React.createElement('h2', { className: "text-2xl font-bold text-gray-900 mb-2" }, 'React Fixed!'),
          React.createElement('p', { className: "text-gray-600" }, 'The React import issue has been resolved. Basic functionality is working.')
        ),
        React.createElement(
          'button',
          {
            onClick: handleConnect,
            disabled: isConnecting,
            className: "w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2"
          },
          isConnecting ? [
            React.createElement(Loader, { key: 'loader', className: "w-5 h-5 animate-spin" }),
            React.createElement('span', { key: 'text' }, 'Connecting...')
          ] : [
            React.createElement(Search, { key: 'search', className: "w-5 h-5" }),
            React.createElement('span', { key: 'text' }, 'Test Connection')
          ]
        )
      ) : React.createElement(
        'div',
        { className: "space-y-6" },
        React.createElement(
          'div',
          { className: "bg-green-50 border border-green-200 rounded-lg p-4" },
          React.createElement('h3', { className: "font-semibold text-green-800 mb-2" }, '✅ Connection Successful!'),
          React.createElement('p', { className: "text-green-700 text-sm" }, 'Wallet connected successfully. React is working properly.')
        ),
        React.createElement(
          'button',
          {
            onClick: handleDisconnect,
            className: "w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          },
          'Disconnect'
        )
      ),
      // Debug Information
      React.createElement(
        'div',
        { className: "mt-8 bg-gray-50 rounded-lg p-4" },
        React.createElement('h4', { className: "font-semibold text-gray-800 mb-3" }, 'Debug Log'),
        React.createElement(
          'div',
          { className: "space-y-1 text-xs text-gray-600 max-h-40 overflow-y-auto" },
          debugInfo.map((info, index) =>
            React.createElement(
              'div',
              { key: index, className: "font-mono" },
              info
            )
          )
        )
      )
    )
  );
}

export default FixedBlockitApp;
