/**
 * Validates an email address.
 * @param email - The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password based on common strength criteria.
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * @param password - The password to validate.
 * @returns An object with `isValid` and a `message` string.
 */
export const validatePassword = (
  password: string
): { isValid: boolean; message: string } => {
  if (!password) {
    return { isValid: false, message: 'Password cannot be empty.' };
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long.`,
    };
  }
  if (!hasUpperCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter.',
    };
  }
  if (!hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter.',
    };
  }
  if (!hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one number.',
    };
  }
  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character.',
    };
  }

  return { isValid: true, message: 'Password is strong.' };
};

/**
 * Validates that a string is not empty or just whitespace.
 * @param text - The string to validate.
 * @param fieldName - The name of the field for the error message.
 * @returns An object with `isValid` and a `message` string.
 */
export const isNotEmpty = (
  text: string,
  fieldName: string = 'Field'
): { isValid: boolean; message: string } => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, message: `${fieldName} cannot be empty.` };
  }
  return { isValid: true, message: '' };
};
