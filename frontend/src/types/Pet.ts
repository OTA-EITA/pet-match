export interface AgeInfo {
  years: number;
  months: number;
  total_months: number;
  is_estimated: boolean;
  age_text: string;
}

export interface MedicalInfo {
  vaccinated: boolean;
  neutered: boolean;
  health_issues: string[];
  last_checkup: string;
  medications: string[];
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age_info: AgeInfo;
  gender: 'male' | 'female';
  size?: 'small' | 'medium' | 'large';
  weight?: number; // 体重 (kg)
  color: string;
  personality: string[];
  medical_info: MedicalInfo;
  owner_id: string;
  status: 'available' | 'adopted' | 'pending';
  location: string;
  images: string[];
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PetResponse {
  limit: number;
  offset: number;
  pets: Pet[];
  total: number;
}
