/**
 * Connection Codes Service
 * 
 * Handles generation and parsing of connection codes:
 * - Relationship codes: BKR-XXXXXX, CTR-XXXXXX, MGR-XXXXXX
 * - Referral codes: RFR-XXXXXX
 * 
 * Relationship codes create specific broker/contractor/manager relationships.
 * Referral codes track general referrals without creating direct relationships.
 */

export type RelationshipCodeType = 'BKR' | 'CTR' | 'MGR';
export type CodeType = RelationshipCodeType | 'RFR';

export interface ParsedCode {
  type: CodeType;
  isRelationshipCode: boolean;
  isReferralCode: boolean;
  originalCode: string;
}

/**
 * Generate a relationship code for broker, contractor, or manager invitations
 * 
 * @param type - The type of relationship code to generate
 * @returns A unique relationship code (e.g., "BKR-A1B2C3")
 */
export function generateRelationshipCode(type: RelationshipCodeType): string {
  // Generate 6-character random alphanumeric code
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Ensure minimum length (handle edge case where random string is too short)
  const paddedRandom = (random + 'ABCDEF').substring(0, 6);
  
  return `${type}-${paddedRandom}`;
}

/**
 * Generate a referral code for general business referrals
 * 
 * @returns A unique referral code (e.g., "RFR-X7Y8Z9")
 */
export function generateReferralCode(): string {
  // Generate 6-character random alphanumeric code
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Ensure minimum length
  const paddedRandom = (random + 'ABCDEF').substring(0, 6);
  
  return `RFR-${paddedRandom}`;
}

/**
 * Parse a code to determine its type
 * 
 * @param code - The code to parse
 * @returns The code type or null if invalid
 */
export function parseCodeType(code: string): CodeType | null {
  if (!code || typeof code !== 'string') {
    return null;
  }

  const normalizedCode = code.trim().toUpperCase();
  const parts = normalizedCode.split('-');
  
  if (parts.length !== 2) {
    return null;
  }

  const [prefix, suffix] = parts;
  
  // Validate suffix format: exactly 6 alphanumeric characters
  if (!suffix || suffix.length !== 6 || !/^[A-Z0-9]{6}$/.test(suffix)) {
    return null;
  }
  
  // Check relationship codes
  if (['BKR', 'CTR', 'MGR'].includes(prefix)) {
    return prefix as RelationshipCodeType;
  }
  
  // Check referral codes
  if (prefix === 'RFR') {
    return 'RFR';
  }
  
  return null;
}

/**
 * Parse a code and return detailed information
 * 
 * @param code - The code to parse
 * @returns Parsed code information or null if invalid
 */
export function parseCode(code: string): ParsedCode | null {
  const type = parseCodeType(code);
  
  if (!type) {
    return null;
  }

  return {
    type,
    isRelationshipCode: ['BKR', 'CTR', 'MGR'].includes(type),
    isReferralCode: type === 'RFR',
    originalCode: code.trim().toUpperCase(),
  };
}

/**
 * Validate a code format (basic structure check)
 * 
 * @param code - The code to validate
 * @returns True if code format is valid
 */
export function validateCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const normalizedCode = code.trim().toUpperCase();
  
  // Must be in format: PREFIX-XXXXXX
  const pattern = /^(BKR|CTR|MGR|RFR)-[A-Z0-9]{6}$/;
  
  return pattern.test(normalizedCode);
}

/**
 * Get a human-readable description of a code type
 * 
 * @param codeType - The code type
 * @returns Human-readable description
 */
export function getCodeTypeDescription(codeType: CodeType): string {
  const descriptions: Record<CodeType, string> = {
    BKR: 'Broker Relationship Code',
    CTR: 'Contractor Relationship Code',
    MGR: 'Manager Relationship Code',
    RFR: 'Referral Code',
  };

  return descriptions[codeType] || 'Unknown Code Type';
}

/**
 * Get the user type that can create this code type
 * 
 * @param codeType - The code type
 * @returns The user type that creates this code
 */
export function getCodeCreatorType(codeType: RelationshipCodeType): 'broker' | 'subcontractor' | 'manager' {
  const creatorMap: Record<RelationshipCodeType, 'broker' | 'subcontractor' | 'manager'> = {
    BKR: 'broker',
    CTR: 'subcontractor',
    MGR: 'manager',
  };

  return creatorMap[codeType];
}

/**
 * Normalize a code to standard format
 * 
 * @param code - The code to normalize
 * @returns Normalized code or null if invalid
 */
export function normalizeCode(code: string): string | null {
  const parsed = parseCode(code);
  return parsed ? parsed.originalCode : null;
}

