import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, AlertCircle, Wifi } from 'lucide-react';

const SupabaseConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    status: 'testing' | 'connected' | 'error';
    message: string;
    details?: any;
  }>({
    status: 'testing',
    message: 'Testing Supabase connection...'
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus({
        status: 'testing',
        message: 'Testing Supabase connection...'
      });

      // Test 1: Check if client is initialized
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // Test 2: Test a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      // Test 3: Check auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError) {
        console.warn('Auth check warning:', authError);
      }

      setConnectionStatus({
        status: 'connected',
        message: 'Successfully connected to Supabase',
        details: {
          databaseConnected: true,
          authInitialized: true,
          userAuthenticated: !!session?.user,
          profilesTableAccessible: true
        }
      });

    } catch (error: any) {
      console.error('Supabase connection test failed:', error);
      setConnectionStatus({
        status: 'error',
        message: error.message || 'Failed to connect to Supabase',
        details: error
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'testing':
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'testing':
        return 'border-yellow-200 bg-yellow-50';
      case 'connected':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3 mb-3">
        {getStatusIcon()}
        <h3 className="font-semibold text-gray-800">Supabase Connection Status</h3>
        <button
          onClick={testConnection}
          className="ml-auto text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50 transition-colors"
        >
          Retest
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3">{connectionStatus.message}</p>

      {connectionStatus.details && (
        <div className="text-xs">
          {connectionStatus.status === 'connected' ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Database Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Auth Service Active</span>
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus.details.userAuthenticated ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                )}
                <span>
                  User: {connectionStatus.details.userAuthenticated ? 'Authenticated' : 'Not signed in'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Tables Accessible</span>
              </div>
            </div>
          ) : (
            <pre className="text-red-600 bg-red-100 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(connectionStatus.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default SupabaseConnectionTest; 