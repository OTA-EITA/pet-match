import Image from 'next/image';
import Link from 'next/link';
import { Pet } from '@/lib/api';

interface PetCardProps {
  pet: Pet;
  favoriteCount?: number;
  ownerVerified?: boolean;
}

export default function PetCard({ pet, favoriteCount, ownerVerified }: PetCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-[#FF8C00]';
      case 'pending':
        return 'bg-yellow-500';
      case 'adopted':
        return 'bg-gray-400';
      default:
        return 'bg-[#FF8C00]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '募集中';
      case 'pending':
        return '交渉中';
      case 'adopted':
        return '決定';
      default:
        return status;
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'male' ? '♂' : '♀';
  };

  const getGenderColor = (gender: string) => {
    return gender === 'male' ? 'text-blue-500' : 'text-pink-500';
  };

  const isNewPet = (createdAt?: string) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  return (
    <Link href={`/pets/${pet.id}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
        {/* Image */}
        <div className="relative aspect-square bg-[#FFF5E6]">
          {pet.images && pet.images.length > 0 ? (
            <Image
              src={pet.images[0]}
              alt={pet.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image src="/cat-logo.png" alt="No image" width={64} height={64} className="opacity-50" />
            </div>
          )}
          {/* Status badge */}
          <div className={`absolute top-2 left-2 ${getStatusColor(pet.status)} text-white text-xs font-bold px-2 py-1 rounded`}>
            {getStatusText(pet.status)}
          </div>
          {/* NEW badge */}
          {isNewPet(pet.created_at) && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </div>
          )}
          {/* Owner verified badge */}
          {ownerVerified && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              認証済
            </div>
          )}
          {/* Favorite count badge */}
          {favoriteCount !== undefined && favoriteCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-white/90 text-pink-500 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {favoriteCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-800 truncate">{pet.name}</h3>
            <span className={`text-xl font-bold ${getGenderColor(pet.gender)}`}>
              {getGenderIcon(pet.gender)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{pet.breed}</p>
          <p className="text-sm text-gray-500">{pet.age_info?.age_text || `${pet.age_months}ヶ月`}</p>
          {pet.weight && pet.weight > 0 && (
            <p className="text-sm text-gray-500">{pet.weight}kg</p>
          )}

          {/* Personality tags */}
          {pet.personality && pet.personality.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {pet.personality.slice(0, 3).map((trait, index) => (
                <span
                  key={index}
                  className="text-xs bg-[#FFF5E6] text-[#D97706] px-2 py-1 rounded-full border border-[#FFD9B3]"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
