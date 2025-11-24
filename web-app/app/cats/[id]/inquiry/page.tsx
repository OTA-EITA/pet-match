'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { inquiryApi, CreateInquiryRequest } from '@/lib/inquiryApi';
import { petsApi } from '@/lib/api';
import { Pet } from '@/types/Pet';

export default function InquiryPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [pet, setPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<CreateInquiryRequest>({
    pet_id: petId,
    message: '',
    type: 'question',
    contact_method: 'email',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const petData = await petsApi.getPet(petId);
        setPet(petData);
      } catch (err) {
        console.error('Failed to fetch pet:', err);
        setError('Failed to load pet information');
      }
    };

    fetchPet();
  }, [petId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.message.trim()) {
      setError('Message is required');
      return;
    }

    if (formData.contact_method === 'phone' && !formData.phone?.trim()) {
      setError('Phone number is required when selecting phone as contact method');
      return;
    }

    try {
      setIsSubmitting(true);
      await inquiryApi.createInquiry(formData);
      router.push('/inquiries');
    } catch (err: any) {
      console.error('Failed to create inquiry:', err);
      setError(err.response?.data?.error || 'Failed to submit inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateInquiryRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!pet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Send Inquiry</h1>

      {/* Pet Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4">
          {pet.images && pet.images.length > 0 && (
            <img
              src={pet.images[0]}
              alt={pet.name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{pet.name}</h2>
            <p className="text-gray-600">
              {pet.breed} • {pet.age_info.years} {pet.age_info.years === 1 ? 'year' : 'years'} old
            </p>
          </div>
        </div>
      </div>

      {/* Inquiry Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Inquiry Type */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Inquiry Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="question">Question</option>
            <option value="interview">Interview Request</option>
            <option value="adoption">Adoption Application</option>
          </select>
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Message *
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Please tell us about your interest in this pet..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Method */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Preferred Contact Method
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="contact_method"
                value="email"
                checked={formData.contact_method === 'email'}
                onChange={(e) => handleInputChange('contact_method', e.target.value)}
                className="mr-2"
              />
              Email
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="contact_method"
                value="phone"
                checked={formData.contact_method === 'phone'}
                onChange={(e) => handleInputChange('contact_method', e.target.value)}
                className="mr-2"
              />
              Phone
            </label>
          </div>
        </div>

        {/* Phone Number (conditional) */}
        {formData.contact_method === 'phone' && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="090-1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
