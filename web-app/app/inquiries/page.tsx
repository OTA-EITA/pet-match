'use client';

import { useState, useEffect } from 'react';
import { inquiryApi, Inquiry } from '@/lib/inquiryApi';

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setIsLoading(true);
        const data = await inquiryApi.getInquiries();
        setInquiries(data);
      } catch (err: any) {
        console.error('Failed to fetch inquiries:', err);
        setError(err.response?.data?.error || 'Failed to load inquiries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInquiries();
  }, []);

  const getStatusBadgeColor = (status: Inquiry['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeColor = (type: Inquiry['type']) => {
    switch (type) {
      case 'question':
        return 'bg-purple-100 text-purple-800';
      case 'interview':
        return 'bg-orange-100 text-orange-800';
      case 'adoption':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading inquiries...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Inquiries</h1>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't sent any inquiries yet.</p>
          <a
            href="/cats"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Browse Cats
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeBadgeColor(
                        inquiry.type
                      )}`}
                    >
                      {inquiry.type.charAt(0).toUpperCase() + inquiry.type.slice(1)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(
                        inquiry.status
                      )}`}
                    >
                      {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Contact via: {inquiry.contact_method}
                    {inquiry.phone && ` (${inquiry.phone})`}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(inquiry.created_at)}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Message:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
              </div>

              <div className="flex gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Pet ID:</span> {inquiry.pet_id}
                </div>
                <div>
                  <span className="font-semibold">Inquiry ID:</span> {inquiry.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
