// Base types
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type PetGender = 'male' | 'female';
export type PetSize = 'small' | 'medium' | 'large' | 'extra_large';
export type PetStatus = 'available' | 'adopted' | 'pending' | 'hold';

// Age information
export interface AgeInfo {
  years: number;
  months: number;
  total_months: number;
  is_estimated: boolean;
  age_text: string;
}

// Medical information
export interface MedicalInfo {
  vaccinated: boolean;
  neutered?: boolean;
  spayed_neutered?: boolean;
  health_issues?: string[];
  health_conditions?: string[];
  last_checkup?: string;
  medications?: string[];
  microchipped?: boolean;
  special_needs?: boolean;
  special_needs_description?: string;
}

// Location information
export interface LocationInfo {
  address: string;
  city: string;
  state: string;
  zipcode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Personality traits
export type PersonalityTrait = 
  | 'friendly'
  | 'energetic'
  | 'calm'
  | 'playful'
  | 'independent'
  | 'social'
  | 'gentle'
  | 'protective'
  | 'curious'
  | 'loyal';

// Main Pet interface
export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age_info: AgeInfo;
  gender: PetGender;
  size: PetSize;
  color: string;
  personality: PersonalityTrait[];
  medical_info: MedicalInfo;
  owner_id: string;
  status: PetStatus;
  location: string | LocationInfo;
  images: string[];
  description: string;
  adoption_fee?: number;
  good_with_kids?: boolean;
  good_with_pets?: boolean;
  energy_level?: 'low' | 'medium' | 'high';
  training_level?: 'none' | 'basic' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at: string;
}

// API Response types
export interface PetResponse {
  limit: number;
  offset: number;
  pets: Pet[];
  total: number;
}

export interface PetSearchParams {
  species?: PetSpecies;
  breed?: string;
  age_min?: number;
  age_max?: number;
  size?: PetSize;
  gender?: PetGender;
  location?: string;
  good_with_kids?: boolean;
  good_with_pets?: boolean;
  limit?: number;
  offset?: number;
}

// Form types for pet creation/editing
export interface PetFormData {
  name: string;
  species: PetSpecies;
  breed: string;
  age_years: number;
  age_months: number;
  gender: PetGender;
  size: PetSize;
  color: string;
  personality: PersonalityTrait[];
  description: string;
  location: string;
  adoption_fee?: number;
  vaccinated: boolean;
  neutered?: boolean;
  spayed_neutered?: boolean;
  health_issues?: string[];
  medications?: string[];
  good_with_kids?: boolean;
  good_with_pets?: boolean;
  energy_level?: 'low' | 'medium' | 'high';
  images: File[] | string[];
}

// Pet status update
export interface PetStatusUpdate {
  id: string;
  status: PetStatus;
  reason?: string;
}
