'use client';

import { useState, useEffect } from 'react';
import { petsApi } from '@/lib/api';
import { authApi } from '@/lib/auth';

interface HealthStatus {
  service: string;
  url: string;
  status: 'ok' | 'error' | 'loading';
  response?: any;
  error?: string;
}

export default function DevStatusPanel() {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Only render on client-side to avoid hydration errors
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkHealth = async () => {
    // Get base URL from environment variable
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    
    const services = [
      {
        service: 'API Gateway',
        url: baseUrl,
        checkFn: () => petsApi.healthCheck()
      },
      {
        service: 'Auth Service', 
        url: process.env.NEXT_PUBLIC_AUTH_URL || `${baseUrl}/api`,
        checkFn: () => authApi.healthCheck()
      }
    ];

    const newStatuses: HealthStatus[] = [];

    for (const { service, url, checkFn } of services) {
      const status: HealthStatus = {
        service,
        url,
        status: 'loading'
      };
      
      try {
        const response = await checkFn();
        status.status = 'ok';
        status.response = response;
      } catch (error: any) {
        status.status = 'error';
        status.error = error.message;
      }
      
      newStatuses.push(status);
    }

    setHealthStatuses(newStatuses);
  };

  const testApiEndpoints = async () => {
    const tests = [];
    
    try {
      // Test pets endpoint
      const petsResponse = await petsApi.getPets(5, 0);
      tests.push({
        endpoint: 'GET /api/pets',
        status: 'ok',
        data: `${petsResponse.total} pets found`
      });
    } catch (error: any) {
      tests.push({
        endpoint: 'GET /api/pets',
        status: 'error',
        data: error.message
      });
    }

    return tests;
  };

  useEffect(() => {
    if (isVisible) {
      checkHealth();
    }
  }, [isVisible]);

  // Only show in development and after client-side hydration
  if (!isClient || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 text-sm"
      >
        {isVisible ? '🔽' : '🔼'} API Status
      </button>
      
      {isVisible && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">🔧 API Integration Status</h3>
            <button
              onClick={checkHealth}
              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Service Health */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Service Health</h4>
              <div className="space-y-2">
                {healthStatuses.map((health, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{health.service}</p>
                      <p className="text-xs text-gray-500">{health.url}</p>
                    </div>
                    <div className="flex items-center">
                      {health.status === 'loading' && (
                        <span className="text-yellow-500">⏳</span>
                      )}
                      {health.status === 'ok' && (
                        <span className="text-green-500">✅</span>
                      )}
                      {health.status === 'error' && (
                        <span className="text-red-500">❌</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environment Info */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Environment</h4>
              <div className="text-xs space-y-1">
                <p><strong>API URL:</strong> {typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : 'Loading...'}</p>
                <p><strong>Auth URL:</strong> {typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_AUTH_URL : 'Loading...'}</p>
                <p><strong>Mode:</strong> Development</p>
              </div>
            </div>

            {/* Quick Tests */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Quick Tests</h4>
              <div className="space-y-1">
                <button
                  onClick={() => testApiEndpoints()}
                  className="w-full px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  Test API Endpoints
                </button>
                <button
                  onClick={() => window.open('http://localhost:18081/health', '_blank')}
                  className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Open Health Check
                </button>
                <button
                  onClick={() => {
                    console.log('Current localStorage tokens:');
                    console.log('Access Token:', localStorage.getItem('access_token'));
                    console.log('Refresh Token:', localStorage.getItem('refresh_token'));
                  }}
                  className="w-full px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Log Tokens to Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
