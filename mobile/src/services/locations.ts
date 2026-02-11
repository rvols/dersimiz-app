/**
 * Hierarchical locations API (GET /api/v1/locations).
 * Public endpoint; no auth required.
 */

import { api } from './api';
import type { LocationItem } from '../types/api';

export interface LocationsResponse {
  success: true;
  data: { locations: LocationItem[] };
}

/**
 * Fetch locations: roots (countries) when parentId is omitted/empty, otherwise children of parentId.
 */
export async function fetchLocations(parentId?: string | null): Promise<LocationItem[]> {
  const params = parentId ? { parent_id: parentId } : {};
  const { data } = await api.get<LocationsResponse>('/locations', { params });
  return data?.data?.locations ?? [];
}
