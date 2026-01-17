/**
 * Validation Utility
 * 
 * Common validation functions used throughout the app.
 */

/**
 * Validate an email address format
 * 
 * @param email - Email address to validate
 * @returns true if the email format is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password meets minimum requirements
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters.' };
  }
  return { isValid: true };
}

/**
 * Validate that two passwords match
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns true if passwords match
 */
export function validatePasswordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Validate a display name
 * 
 * @param name - Display name to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateDisplayName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters.' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters.' };
  }
  return { isValid: true };
}
