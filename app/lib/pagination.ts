/**
 * Maximum number of listings that can be requested per page
 */
export const MAX_LISTINGS_PER_PAGE = 50;

/**
 * Default number of listings per page
 */
export const DEFAULT_LISTINGS_PER_PAGE = 12;

/**
 * Validates and normalizes the limit parameter for listing pagination
 */
export function validateListingsLimit(limit?: number): number {
  const parsedLimit = limit ?? DEFAULT_LISTINGS_PER_PAGE;
  return Math.min(Math.max(parsedLimit, 1), MAX_LISTINGS_PER_PAGE);
}
