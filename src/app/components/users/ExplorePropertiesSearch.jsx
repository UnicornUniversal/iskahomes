"use client";

import React from "react";
import { Search } from "lucide-react";

const ExplorePropertiesSearch = ({ className = '' }) => {
  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary_color/50 pointer-events-none" />
        <input
          type="text"
          placeholder="Search properties..."
          readOnly
          aria-label="Search properties"
          className="w-full pl-8 pr-2.5 py-1.5 md:pl-9 md:pr-3 md:py-2 text-xs md:text-sm text-primary_color placeholder:text-primary_color/40 bg-white border border-primary_color/15 rounded-full outline-none focus:border-primary_color/40 transition-colors"
        />
      </div>
    </div>
  );
};

export default ExplorePropertiesSearch;
