/**
 * Validation utilities for form inputs
 * Separates validation logic from UI layer
 */

export const ValidationRules = {
  email: {
    pattern: /\S+@\S+\.\S+/,
    message: 'Invalid email format',
  },
  password: {
    minLength: 8,
    message: 'Password must be at least 8 characters',
  },
  phone: {
    pattern: /^[0-9]{10,11}$/,
    message: 'Phone number must be 10-11 digits',
  },
  required: {
    message: 'This field is required',
  },
};

export const Validators = {
  /**
   * Validate email address
   */
  email(value: string): string | null {
    if (!value || !value.trim()) {
      return ValidationRules.required.message;
    }
    if (!ValidationRules.email.pattern.test(value.trim())) {
      return ValidationRules.email.message;
    }
    return null;
  },

  /**
   * Validate password
   */
  password(value: string): string | null {
    if (!value || !value.trim()) {
      return ValidationRules.required.message;
    }
    if (value.length < ValidationRules.password.minLength) {
      return ValidationRules.password.message;
    }
    return null;
  },

  /**
   * Validate phone number
   */
  phone(value: string): string | null {
    if (!value || !value.trim()) {
      return ValidationRules.required.message;
    }
    const cleaned = value.replace(/[-\s]/g, '');
    if (!ValidationRules.phone.pattern.test(cleaned)) {
      return ValidationRules.phone.message;
    }
    return null;
  },

  /**
   * Validate required field
   */
  required(value: string, minLength?: number): string | null {
    if (!value || !value.trim()) {
      return ValidationRules.required.message;
    }
    if (minLength && value.trim().length < minLength) {
      return `Must be at least ${minLength} characters`;
    }
    return null;
  },

  /**
   * Validate name (non-empty string)
   */
  name(value: string): string | null {
    if (!value || !value.trim()) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  },
};

/**
 * Validate multiple fields at once
 * Returns an object with field names as keys and error messages as values
 */
export const validateFields = (
  fields: Record<string, string>,
  rules: Record<string, (value: string) => string | null>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(fields).forEach((fieldName) => {
    const validator = rules[fieldName];
    if (validator) {
      const error = validator(fields[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    }
  });

  return errors;
};

/**
 * Check if validation errors object has any errors
 */
export const hasErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};
