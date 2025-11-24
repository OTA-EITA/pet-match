'use client';

import { useState, useEffect } from 'react';
import { petsApi } from '@/lib/api';
import { authApi } from '@/lib/auth';

export default function DevStatusPage() {
  const [serviceStatus, setServiceStatus] = useState({
    pet: { status: 'checking', message: '' },
    auth: { status: 'checking', message: '' },
  });

  const checkServices = async () => {
    // Check Pet Service
    try {
      await petsApi.healthCheck();
      setServiceStatus(prev => ({
        ...prev,
        pet: { status: 'online', message: 'Pet Service is accessible' }
      }));
    } catch (error) {
      setServiceStatus(prev => ({
        ...prev,
        pet: { 
          status: 'offline', 
          message: `Pet Service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }
      }));
    }

    // Check Auth Service
    try {
      await authApi.healthCheck();
      setServiceStatus(prev => ({
        ...prev,
        auth: { status: 'online', message: 'Auth Service is accessible' }
      }));
    } catch (error) {
      setServiceStatus(prev => ({
        ...prev,
        auth: { 
          status: 'offline', 
          message: `Auth Service error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }
      }));
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '✅';
      case 'offline': return '❌';
      default: return '⏳';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Development Service Status</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pet Service Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Pet Service</h2>
            <span className="text-2xl">{getStatusIcon(serviceStatus.pet.status)}</span>
          </div>
          
          <div className="space-y-2">
            <p><strong>URL:</strong> http://localhost:8083</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 font-semibold ${getStatusColor(serviceStatus.pet.status)}`}>
                {serviceStatus.pet.status.toUpperCase()}
              </span>
            </p>
            <p><strong>Message:</strong> {serviceStatus.pet.message}</p>
          </div>
        </div>

        {/* Auth Service Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Auth Service</h2>
            <span className="text-2xl">{getStatusIcon(serviceStatus.auth.status)}</span>
          </div>
          
          <div className="space-y-2">
            <p><strong>URL:</strong> http://localhost:8081</p>
            <p><strong>Status:</strong> 
              <span className={`ml-2 font-semibold ${getStatusColor(serviceStatus.auth.status)}`}>
                {serviceStatus.auth.status.toUpperCase()}
              </span>
            </p>
            <p><strong>Message:</strong> {serviceStatus.auth.message}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-4">
        <button
          onClick={checkServices}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Refresh Status
        </button>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Commands:</h3>
          <div className="space-y-1 text-sm text-gray-700">
            <p><code>make start</code> - Start port forwarding</p>
            <p><code>make stop</code> - Stop port forwarding</p>
            <p><code>make health</code> - Check all services</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Note:</h3>
          <p className="text-yellow-700 text-sm">
            If services are offline, authentication will be bypassed in development mode, 
            allowing you to view the Pet listing page without login.
          </p>
        </div>
      </div>
    </div>
  );
}
