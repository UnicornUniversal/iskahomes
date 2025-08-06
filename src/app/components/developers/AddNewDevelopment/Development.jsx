"use client"
import React, { useState, useEffect } from 'react'
import DevelopmentDescription from './DevelopmentDescription'
import DevelopmentLocation from './DevelopmentLocation'
import DevelopmentAmenities from './DevelopmentAmenities'
import DevelopmentMedia from './DevelopmentMedia'
import { developments } from '@/app/components/Data/Data'

const Development = ({ isAddMode, developmentId }) => {
  const [activePart, setActivePart] = useState(0);
  const [developmentData, setDevelopmentData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch development data if in edit mode
  useEffect(() => {
    if (!isAddMode && developmentId) {
      fetchDevelopmentData();
    }
  }, [isAddMode, developmentId]);

  const fetchDevelopmentData = async () => {
    setLoading(true);
    try {
      // Commented out API call - using dummy data instead
      // const response = await fetch(`/api/developments/${developmentId}`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setDevelopmentData(data);
      // } else {
      //   console.error('Failed to fetch development data');
      // }

      // Search for development in dummy data
      const foundDevelopment = developments.find(dev => dev.id === developmentId);
      if (foundDevelopment) {
        setDevelopmentData(foundDevelopment);
      } else {
        console.error('Development not found in dummy data');
      }
    } catch (error) {
      console.error('Error fetching development data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevelopment = async () => {
    if (!confirm('Are you sure you want to delete this development? This action cannot be undone.')) {
      return;
    }

    try {
      // Commented out API call - using dummy data instead
      // const response = await fetch(`/api/developments/${developmentId}`, {
      //   method: 'DELETE',
      // });
      
      // if (response.ok) {
      //   // Redirect to developments list or show success message
      //   window.location.href = '/developer/developments';
      // } else {
      //   console.error('Failed to delete development');
      // }

      // Simulate delete operation with dummy data
      console.log('Development deleted (dummy operation):', developmentId);
      // Redirect to developments list
      window.location.href = '/developer/developments';
    } catch (error) {
      console.error('Error deleting development:', error);
    }
  };

  // Dynamic form parts with development data
  const formParts = [
    { 
      label: 'Description', 
      component: <DevelopmentDescription developmentData={developmentData} isEditMode={!isAddMode} /> 
    },
    { 
      label: 'Location', 
      component: <DevelopmentLocation developmentData={developmentData} isEditMode={!isAddMode} /> 
    },
    { 
      label: 'Amenities', 
      component: <DevelopmentAmenities developmentData={developmentData} isEditMode={!isAddMode} /> 
    },
    { 
      label: 'Media', 
      component: <DevelopmentMedia developmentData={developmentData} isEditMode={!isAddMode} /> 
    },
  ];

  if (loading) {
    return (
      <div className='w-full flex justify-center items-center py-8'>
        <div className='text-lg'>Loading development data...</div>
      </div>
    );
  }

  return (
    <div className='w-full flex flex-col gap-4'>
      {/* Header */}
      <div className='flex justify-between items-center w-full'>
        <h1 className='text-2xl font-bold'>
          {isAddMode ? 'Add New Development' : 'Edit Development'}
        </h1>
        {!isAddMode && (
          <button
            onClick={handleDeleteDevelopment}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
          >
            Delete Development
          </button>
        )}
      </div>

      {/* Header Navigation */}
      <div className='flex gap-4 w-full'>
        {formParts.map((part, idx) => (
          <button
            key={part.label}
            onClick={() => setActivePart(idx)}
            style={{
              padding: '0.5rem 1rem',
              background: idx === activePart ? '#333' : '#eee',
              color: idx === activePart ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: idx === activePart ? 'bold' : 'normal',
            }}
          >
            {part.label}
          </button>
        ))}
      </div>
      
      {/* Conditionally Render Form Part */}
      {formParts[activePart].component}
    </div>
  )
}

export default Development
