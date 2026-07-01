"use client";

import React from "react";
import { LayoutList, Map, SlidersHorizontal } from "lucide-react";
import ExplorePropertiesSearch from "./ExplorePropertiesSearch";

const ExplorePropertiesToolbar = ({ onOpenFilters, viewMode, onViewModeChange, onSearch, searchValue = '', variant = 'compact' }) => {
  const isOverlay = variant === 'overlay';

  return (
    <div className={`flex items-center gap-1.5 md:gap-2 w-full ${isOverlay ? 'max-w-2xl' : ''}`}>
      <ExplorePropertiesSearch
        className={isOverlay ? 'min-w-0 md:min-w-[200px]' : ''}
        onSearch={onSearch}
        value={searchValue}
      />

      {onOpenFilters && (
        <button
          type="button"
          onClick={onOpenFilters}
          className="lg:hidden flex-shrink-0 flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary_color text-white shadow-sm hover:bg-primary_color/90 transition-colors"
          aria-label="Open filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}

      <div className={`flex-shrink-0 flex items-center gap-0.5 bg-white rounded-full shadow-sm border border-primary_color/10 ${
        isOverlay ? 'p-0.5 md:p-1' : 'p-0.5'
      }`}>
        <button
          type="button"
          onClick={() => onViewModeChange("map")}
          className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all duration-200 ${
            viewMode === "map"
              ? "bg-primary_color text-white shadow-sm"
              : "text-primary_color hover:bg-primary_color/10"
          }`}
          aria-label="Map view"
          aria-pressed={viewMode === "map"}
        >
          <Map className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full transition-all duration-200 ${
            viewMode === "list"
              ? "bg-primary_color text-white shadow-sm"
              : "text-primary_color hover:bg-primary_color/10"
          }`}
          aria-label="List view"
          aria-pressed={viewMode === "list"}
        >
          <LayoutList className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ExplorePropertiesToolbar;
