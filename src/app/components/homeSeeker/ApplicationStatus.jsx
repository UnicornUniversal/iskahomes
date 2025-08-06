import React from 'react'
import { FiCheckCircle, FiClock, FiFileText, FiUser } from 'react-icons/fi'

const ApplicationStatus = () => {
  const applications = [
    {
      id: 1,
      property: "Luxury Villa - East Legon",
      type: "Rental Application",
      status: "Under Review",
      submittedDate: "2024-02-10",
      agent: "John Agent",
      progress: 75
    },
    {
      id: 2,
      property: "Modern Apartment - Airport",
      type: "Purchase Application",
      status: "Documents Required",
      submittedDate: "2024-02-08",
      agent: "Sarah Agent",
      progress: 45
    }
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'under review':
        return 'bg-blue-100 text-blue-800'
      case 'documents required':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 40) return 'bg-yellow-500'
    return 'bg-gray-300'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Application Status</h3>
        <FiFileText className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4">
        {applications.map((application) => (
          <div key={application.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 text-sm mb-1">{application.property}</h4>
                <div className="flex items-center text-gray-600 text-xs mb-2">
                  <FiUser className="w-3 h-3 mr-1" />
                  <span>{application.agent}</span>
                </div>
                <div className="text-gray-600 text-xs">
                  <span>{application.type}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>
            
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{application.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(application.progress)}`}
                  style={{ width: `${application.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Submitted: {formatDate(application.submittedDate)}</span>
              <button className="text-primary_color hover:text-primary_color/80 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-primary_color text-sm font-medium hover:text-primary_color/80 transition-colors">
        View All Applications
      </button>
    </div>
  )
}

export default ApplicationStatus 