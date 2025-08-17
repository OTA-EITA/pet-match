// Type-safe utility functions for the PetMatch application

import { Pet, PetSpecies, PetSize, PersonalityTrait, User } from '@/types';

// Date utilities
export const dateUtils = {
  // Format date to human-readable string
  formatDate: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Format date for datetime-local input
  formatDateTimeLocal: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 16);
  },

  // Calculate age from birth date
  calculateAge: (birthDate: string | Date): { years: number; months: number } => {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months };
  },

  // Get relative time (e.g., '2 hours ago')
  getRelativeTime: (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 30) return `${diffDays}日前`;
    
    return dateUtils.formatDate(d);
  },
};

// String utilities
export const stringUtils = {
  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Truncate string with ellipsis
  truncate: (str: string, length: number): string => {
    return str.length <= length ? str : `${str.slice(0, length)}...`;
  },

  // Generate slug from string
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  // Check if string is valid email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Generate random string
  generateRandomString: (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
};

// Number utilities
export const numberUtils = {
  // Format number with commas
  formatNumber: (num: number): string => {
    return num.toLocaleString('ja-JP');
  },

  // Format currency (JPY)
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  },

  // Clamp number between min and max
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },

  // Calculate percentage
  percentage: (value: number, total: number): number => {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  },
};

// Array utilities
export const arrayUtils = {
  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Shuffle array
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Remove duplicates
  unique: <T>(array: T[]): T[] => {
    return Array.from(new Set(array));
  },

  // Group array by key
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
};

// File utilities
export const fileUtils = {
  // Format file size
  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension: (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  },

  // Validate file type
  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  // Validate file size
  isValidFileSize: (file: File, maxSizeBytes: number): boolean => {
    return file.size <= maxSizeBytes;
  },

  // Create file from blob
  createFileFromBlob: (blob: Blob, filename: string, type: string): File => {
    return new File([blob], filename, { type });
  },
};

// Pet-specific utilities
export const petUtils = {
  // Get pet age display text
  getAgeDisplay: (pet: Pet): string => {
    const { age_info } = pet;
    if (age_info.years === 0) {
      return `${age_info.months}ヶ月`;
    }
    if (age_info.months === 0) {
      return `${age_info.years}歳`;
    }
    return `${age_info.years}歳${age_info.months}ヶ月`;
  },

  // Get size display text
  getSizeDisplay: (size: PetSize): string => {
    const sizeMap: Record<PetSize, string> = {
      small: '小型',
      medium: '中型',
      large: '大型',
      extra_large: '超大型',
    };
    return sizeMap[size];
  },

  // Get species display text
  getSpeciesDisplay: (species: PetSpecies): string => {
    const speciesMap: Record<PetSpecies, string> = {
      dog: '犬',
      cat: '猫',
      bird: '鳥',
      rabbit: 'うさぎ',
      other: 'その他',
    };
    return speciesMap[species];
  },

  // Get personality trait display text
  getPersonalityDisplay: (trait: PersonalityTrait): string => {
    const traitMap: Record<PersonalityTrait, string> = {
      friendly: '人懐っこい',
      energetic: '活発',
      calm: '穏やか',
      playful: '遊び好き',
      independent: '独立心がある',
      social: '社交的',
      gentle: '優しい',
      protective: '警戒心がある',
      curious: '好奇心旺盛',
      loyal: '忠実',
    };
    return traitMap[trait];
  },

  // Filter pets by criteria
  filterPets: (pets: Pet[], filters: {
    species?: PetSpecies;
    size?: PetSize;
    ageMin?: number;
    ageMax?: number;
    personality?: PersonalityTrait[];
  }): Pet[] => {
    return pets.filter(pet => {
      if (filters.species && pet.species !== filters.species) return false;
      if (filters.size && pet.size !== filters.size) return false;
      if (filters.ageMin && pet.age_info.total_months < filters.ageMin * 12) return false;
      if (filters.ageMax && pet.age_info.total_months > filters.ageMax * 12) return false;
      if (filters.personality && filters.personality.length > 0) {
        const hasMatchingTrait = filters.personality.some(trait => 
          pet.personality.includes(trait)
        );
        if (!hasMatchingTrait) return false;
      }
      return true;
    });
  },

  // Sort pets by criteria
  sortPets: (pets: Pet[], sortBy: 'name' | 'age' | 'created_at', order: 'asc' | 'desc' = 'asc'): Pet[] => {
    const sorted = [...pets].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'age':
          comparison = a.age_info.total_months - b.age_info.total_months;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  },
};

// User utilities
export const userUtils = {
  // Get user display name
  getDisplayName: (user: User): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || user.email;
  },

  // Get user initials
  getInitials: (user: User): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  },

  // Check if user can edit pet
  canEditPet: (user: User, pet: Pet): boolean => {
    return user.id === pet.owner_id || user.role === 'admin';
  },

  // Check if user can view admin features
  isAdmin: (user: User): boolean => {
    return user.role === 'admin';
  },

  // Check if user is shelter
  isShelter: (user: User): boolean => {
    return user.role === 'shelter';
  },
};

// Form validation utilities
export const validationUtils = {
  // Validate required field
  required: (value: unknown): string | null => {
    if (value === null || value === undefined || value === '') {
      return 'この項目は必須です';
    }
    return null;
  },

  // Validate email format
  email: (value: string): string | null => {
    if (!stringUtils.isValidEmail(value)) {
      return '有効なメールアドレスを入力してください';
    }
    return null;
  },

  // Validate minimum length
  minLength: (minLength: number) => (value: string): string | null => {
    if (value.length < minLength) {
      return `${minLength}文字以上で入力してください`;
    }
    return null;
  },

  // Validate maximum length
  maxLength: (maxLength: number) => (value: string): string | null => {
    if (value.length > maxLength) {
      return `${maxLength}文字以下で入力してください`;
    }
    return null;
  },

  // Validate number range
  numberRange: (min: number, max: number) => (value: number): string | null => {
    if (value < min || value > max) {
      return `${min}から${max}の間で入力してください`;
    }
    return null;
  },

  // Validate password strength
  password: (value: string): string | null => {
    if (value.length < 8) {
      return 'パスワードは8文字以上で入力してください';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return 'パスワードは英小文字、英大文字、数字をそれぞれ1文字以上含む必要があります';
    }
    return null;
  },

  // Validate phone number (Japanese format)
  phoneNumber: (value: string): string | null => {
    const phoneRegex = /^(\+81|0)\d{1,4}-?\d{1,4}-?\d{4}$/;
    if (!phoneRegex.test(value.replace(/\s/g, ''))) {
      return '有効な電話番号を入力してください';
    }
    return null;
  },
};

// Local storage utilities with type safety
export const storageUtils = {
  // Set item to localStorage
  setItem: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  // Get item from localStorage
  getItem: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  },

  // Remove item from localStorage
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  // Clear all localStorage
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

// URL utilities
export const urlUtils = {
  // Build query string from object
  buildQueryString: (params: Record<string, unknown>): string => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  },

  // Parse query string to object
  parseQueryString: (queryString: string): Record<string, string> => {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
  },

  // Validate URL format
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

// Debounce utility
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Deep clone utility
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// Type guard utilities
export const typeGuards = {
  isString: (value: unknown): value is string => {
    return typeof value === 'string';
  },

  isNumber: (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value);
  },

  isArray: <T>(value: unknown): value is T[] => {
    return Array.isArray(value);
  },

  isObject: (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  isDefined: <T>(value: T | undefined | null): value is T => {
    return value !== undefined && value !== null;
  },
};
