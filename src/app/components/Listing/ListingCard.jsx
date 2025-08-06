import React from 'react';
import Link from 'next/link';
import { FiMapPin } from 'react-icons/fi';
import { BsHouseDoor, BsCupHot, BsDroplet } from 'react-icons/bs';

const ListingCard = ({ property }) => {
  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Rented Out':
        return 'bg-red-100 text-red-800';
      case 'Sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Link href={`/property/${property.slug}`} className="block group">
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-gray-200">
        {/* Image Container */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={property.projectImages[0]}
            alt={property.propertyName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
          {/* Price Badge */}
          <div className="absolute top-4 right-4">
            <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-lg font-bold text-gray-900 shadow-lg">
              {formatPrice(property.price)}
            </span>
          </div>
          {/* Purpose Badge */}
          <div className="absolute bottom-4 left-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {property.categorization.purpose}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Property Name */}
          <h6  className=" font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {property.propertyName}
          </h6>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-4">
            <FiMapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {property.address.city}, {property.address.state}
            </span>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {property.details.bedrooms && (
              <div className="flex items-center text-gray-700">
                <BsHouseDoor className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">{property.details.bedrooms} Bed</span>
              </div>
            )}
            {property.details.kitchen && (
              <div className="flex items-center text-gray-700">
                <BsCupHot className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">{property.details.kitchen} Kitchen</span>
              </div>
            )}
            {property.details.washrooms && (
              <div className="flex items-center text-gray-700">
                <BsDroplet className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium">{property.details.washrooms} Bath</span>
              </div>
            )}
          </div>

          {/* Property Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {property.categorization.type} • {property.categorization.category}
            </span>
            {/* View Details Button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-blue-600 text-sm font-semibold">View Details →</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
