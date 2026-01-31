/**
 * Password Validation Utility
 * 
 * Provides password strength validation and requirements checking
 * following industry best practices (8+ chars, complexity requirements)
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: {
    score: number; // 0-100
    level: 'weak' | 'medium' | 'strong' | 'very-strong';
  };
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Validates password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Check requirements
  if (!requirements.minLength) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  const isValid = errors.length === 0;
  const strength = calculatePasswordStrength(password, requirements);

  return {
    isValid,
    errors,
    strength,
    requirements,
  };
}

/**
 * Calculates password strength score and level
 */
export function calculatePasswordStrength(
  password: string,
  requirements?: PasswordValidationResult['requirements']
): PasswordValidationResult['strength'] {
  let score = 0;

  // Length scoring (0-25 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 5;

  // Character variety scoring (0-50 points)
  const reqs = requirements || {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  if (reqs.hasUppercase) score += 10;
  if (reqs.hasLowercase) score += 10;
  if (reqs.hasNumber) score += 10;
  if (reqs.hasSpecialChar) score += 10;

  // Complexity bonus (0-25 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.5) score += 10;
  if (uniqueChars >= password.length * 0.7) score += 10;
  if (password.length >= 12 && uniqueChars >= 8) score += 5;

  // Determine strength level
  let level: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 40) {
    level = 'weak';
  } else if (score < 60) {
    level = 'medium';
  } else if (score < 80) {
    level = 'strong';
  } else {
    level = 'very-strong';
  }

  return { score: Math.min(100, score), level };
}

/**
 * Gets list of unmet password requirements
 */
export function getPasswordRequirements(
  requirements: PasswordValidationResult['requirements']
): string[] {
  const unmet: string[] = [];
  
  if (!requirements.minLength) {
    unmet.push('At least 8 characters');
  }
  if (!requirements.hasUppercase) {
    unmet.push('One uppercase letter');
  }
  if (!requirements.hasLowercase) {
    unmet.push('One lowercase letter');
  }
  if (!requirements.hasNumber) {
    unmet.push('One number');
  }
  if (!requirements.hasSpecialChar) {
    unmet.push('One special character');
  }

  return unmet;
}

/**
 * Checks if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}






