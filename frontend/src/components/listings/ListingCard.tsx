import { Link } from 'react-router-dom';
import { MapPin, Ruler, Zap, Shield } from 'lucide-react';
import { formatPrice, getImageUrl, BOAT_TYPES, FUEL_TYPES } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import type { Listing } from '@/types';

interface ListingCardProps {
  listing: Listing;
  showStatus?: boolean;
  adminLink?: boolean;
}

export function ListingCard({ listing, showStatus = false, adminLink = false }: ListingCardProps) {
  const imageUrl = getImageUrl(
    listing.primary_image ||
    listing.listing_images?.[0]?.storage_path
  );

  const linkTo = adminLink
    ? `/admin/listings/${listing.id}`
    : `/boote/${listing.slug}`;

  return (
    <Link to={linkTo} className="group block">
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative overflow-hidden h-48 bg-gray-100">
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e2e8f0"/%3E%3Ctext x="200" y="150" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="16" font-family="sans-serif"%3EKein Bild%3C/text%3E%3C/svg%3E';
            }}
          />
          {/* Check-up badge */}
          {listing.status === 'published' && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 bg-navy-900/90 text-white text-xs font-medium px-2 py-1 rounded-full">
                <Shield className="h-3 w-3" />
                Geprüft
              </span>
            </div>
          )}
          {showStatus && (
            <div className="absolute top-2 right-2">
              <StatusBadge status={listing.status} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <p className="text-xl font-bold text-navy-900 mb-1">
            {formatPrice(listing.price)}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-navy-700 transition-colors">
            {listing.title}
          </h3>

          {/* Brand, Model, Year */}
          <p className="text-sm text-gray-500 mb-3">
            {listing.year} • {listing.brand} {listing.model}
            {listing.boat_type && ` • ${BOAT_TYPES[listing.boat_type] || listing.boat_type}`}
          </p>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
            {listing.length_m && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                {listing.length_m} m
              </span>
            )}
            {listing.engine_power_hp && (
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                {listing.engine_power_hp} PS
              </span>
            )}
            {listing.fuel_type && (
              <span>{FUEL_TYPES[listing.fuel_type] || listing.fuel_type}</span>
            )}
          </div>

          {/* Location */}
          {listing.location_city && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
              <MapPin className="h-3.5 w-3.5" />
              {listing.location_city}{listing.location_country && `, ${listing.location_country}`}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
