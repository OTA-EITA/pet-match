import Image from 'next/image';
import Link from 'next/link';
import { Pet } from '@/lib/api';

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
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
