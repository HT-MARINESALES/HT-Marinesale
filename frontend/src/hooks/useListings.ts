import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Listing, PaginatedResponse, ListingFormData } from '../types';

interface ListingsFilter {
  search?: string;
  brand?: string;
  boat_type?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  fuel_type?: string;
  condition?: string;
  sort?: string;
  page?: number;
  limit?: number;
  status?: string;
  [key: string]: unknown;
}

function buildQueryString(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.set(k, String(v));
    }
  });
  return q.toString() ? `?${q.toString()}` : '';
}

// Public listings
export function usePublicListings(filters: ListingsFilter = {}) {
  return useQuery({
    queryKey: ['public-listings', filters],
    queryFn: () => api.get<PaginatedResponse<Listing>>(`/listings${buildQueryString(filters)}`),
  });
}

export function usePublicListing(slug: string) {
  return useQuery({
    queryKey: ['public-listing', slug],
    queryFn: () => api.get<Listing>(`/listings/${slug}`),
    enabled: !!slug,
  });
}

// Seller listings
export function useSellerListings() {
  return useQuery({
    queryKey: ['seller-listings'],
    queryFn: () => api.get<Listing[]>('/seller/listings'),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ListingFormData) => api.post<Listing>('/seller/listings', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-listings'] }),
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ListingFormData> }) =>
      api.put<Listing>(`/seller/listings/${id}`, data),
    onSuccess: (updatedListing, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      queryClient.setQueryData(['seller-listing', id], updatedListing);
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/seller/listings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-listings'] }),
  });
}

export function useRestoreListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/seller/listings/${id}/restore`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      queryClient.invalidateQueries({ queryKey: ['seller-listing', id] });
    },
  });
}

export function useSubmitListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/seller/listings/${id}/submit`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      queryClient.invalidateQueries({ queryKey: ['seller-listing', id] });
    },
  });
}

// Admin listings
export function useAdminListings(filters: ListingsFilter = {}) {
  return useQuery({
    queryKey: ['admin-listings', filters],
    queryFn: () => api.get<PaginatedResponse<Listing>>(`/admin/listings${buildQueryString(filters)}`),
  });
}

export function useAdminListing(id: string) {
  return useQuery({
    queryKey: ['admin-listing', id],
    queryFn: () => api.get<Listing>(`/admin/listings/${id}`),
    enabled: !!id,
  });
}

export function useAdminUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put<Listing>(`/admin/listings/${id}`, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing', id] });
    },
  });
}

export function useAdminChangeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes, rejection_reason, checkup_date }: {
      id: string;
      status: string;
      notes?: string;
      rejection_reason?: string;
      checkup_date?: string;
    }) => api.put(`/admin/listings/${id}/status`, { status, notes, rejection_reason, checkup_date }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listing', id] });
    },
  });
}

export function useAdminDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/listings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-listings'] }),
  });
}
