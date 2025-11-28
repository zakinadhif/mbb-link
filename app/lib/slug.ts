/**
 * Generate a URL-friendly slug from a title string
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Parse a slug-id format string to extract the ID
 * Format: {slug}-{id}
 * The ID is expected to be a nanoid (21 chars by default) at the end
 * 
 * This function finds the last segment that looks like a nanoid (alphanumeric with _ and -)
 * and treats everything before it as the slug.
 */
export function parseSlugId(slugId: string): string {
  // nanoid default length is 21 characters
  const NANOID_LENGTH = 21;
  
  // If the string is short enough to be just an ID, return it as-is
  if (slugId.length <= NANOID_LENGTH) {
    return slugId;
  }
  
  // Take the last 21 characters as the ID (standard nanoid length)
  // This assumes IDs are always at the end and are 21 chars
  const potentialId = slugId.slice(-NANOID_LENGTH);
  
  // Verify it looks like a nanoid (alphanumeric with possible _ and -)
  if (/^[A-Za-z0-9_-]+$/.test(potentialId)) {
    return potentialId;
  }
  
  // Fallback: if not a valid pattern, just return the whole string
  // This handles cases where it's already just an ID
  return slugId;
}

/**
 * Create a slug-id format string from slug and ID
 * Format: {slug}-{id}
 */
export function createSlugId(slug: string, id: string): string {
  // If slug is empty or just hyphens, return just the ID
  if (!slug || slug.replace(/-/g, '').length === 0) {
    return id;
  }
  return `${slug}-${id}`;
}
