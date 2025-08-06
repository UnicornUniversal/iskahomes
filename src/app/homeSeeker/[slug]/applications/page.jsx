'use client'

import React, { useState } from 'react'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeseeker/HomeSeekerHeader'
import HomeSeekerNav from '../../../components/homeseeker/HomeSeekerNav'
import { FiCheckCircle, FiClock, FiXCircle, FiFileText, FiDownload, FiEye, FiMapPin, FiDollarSign } from 'react-icons/fi'

const HomeSeekerApplications = () => {
    const [activeFilter, setActiveFilter] = useState('all')

    // Dummy data for applications
    const applications = [
        {
            id: 1,
            propertyName: "Luxury Villa - East Legon",
            propertyAddress: "East Legon, Accra",
            propertyImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500",
            applicationType: "Rental",
            submittedDate: "2024-01-10",
            status: "approved",
            agentName: "Sarah Johnson",
            agentEmail: "sarah.johnson@iskahomes.com",
            monthlyRent: "$2,500",
            leaseTerm: "12 months",
            documents: [
                { name: "Rental Application Form", status: "submitted" },
                { name: "Proof of Income", status: "submitted" },
                { name: "Bank Statements", status: "submitted" },
                { name: "Reference Letters", status: "submitted" }
            ],
            notes: "Application approved! Welcome to your new home."
        },
        {
            id: 2,
            propertyName: "Modern Apartment - Airport",
            propertyAddress: "Airport Residential, Accra",
            propertyImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
            applicationType: "Purchase",
            submittedDate: "2024-01-05",
            status: "pending",
            agentName: "David Wilson",
            agentEmail: "david.wilson@iskahomes.com",
            purchasePrice: "$450,000",
            downPayment: "$90,000",
            documents: [
                { name: "Purchase Agreement", status: "submitted" },
                { name: "Financial Pre-approval", status: "submitted" },
                { name: "Property Inspection Report", status: "pending" },
                { name: "Title Search", status: "in_progress" }
            ],
            notes: "Application under review. We'll contact you within 3-5 business days."
        },
        {
            id: 3,
            propertyName: "Studio Apartment - Osu",
            propertyAddress: "Osu, Accra",
            propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500",
            applicationType: "Rental",
            submittedDate: "2024-01-08",
            status: "rejected",
            agentName: "Lisa Chen",
            agentEmail: "lisa.chen@iskahomes.com",
            monthlyRent: "$1,200",
            leaseTerm: "6 months",
            documents: [
                { name: "Rental Application Form", status: "submitted" },
                { name: "Proof of Income", status: "submitted" },
                { name: "Bank Statements", status: "submitted" },
                { name: "Reference Letters", status: "missing" }
            ],
            notes: "Application rejected due to insufficient income verification."
        }
    ]

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved':
                return <FiCheckCircle className="w-5 h-5 text-green-500" />
            case 'pending':
                return <FiClock className="w-5 h-5 text-yellow-500" />
            case 'rejected':
                return <FiXCircle className="w-5 h-5 text-red-500" />
            default:
                return <FiClock className="w-5 h-5 text-gray-500" />
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getDocumentStatusIcon = (status) => {
        switch (status) {
            case 'submitted':
                return <FiCheckCircle className="w-4 h-4 text-green-500" />
            case 'pending':
                return <FiClock className="w-4 h-4 text-yellow-500" />
            case 'in_progress':
                return <FiClock className="w-4 h-4 text-blue-500" />
            case 'missing':
                return <FiXCircle className="w-4 h-4 text-red-500" />
            default:
                return <FiClock className="w-4 h-4 text-gray-500" />
        }
    }

    const filteredApplications = activeFilter === 'all' 
        ? applications 
        : applications.filter(app => app.status === activeFilter)

    return (
        <Layout1>
            <div className="flex">
                <HomeSeekerNav active={5} />
                <div className="flex-1 p-8">
                    <HomeSeekerHeader />
                    
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
                            <div className="flex space-x-2">
                                {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                            activeFilter === filter
                                                ? 'bg-primary_color text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {filteredApplications.map((application) => (
                                <div key={application.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Property Image */}
                                        <div className="lg:w-1/4">
                                            <img
                                                src={application.propertyImage}
                                                alt={application.propertyName}
                                                className="w-full h-48 lg:h-32 object-cover rounded-lg"
                                            />
                                        </div>

                                        {/* Application Details */}
                                        <div className="lg:w-3/4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                                        {application.propertyName}
                                                    </h3>
                                                    <p className="text-gray-600 flex items-center">
                                                        <FiMapPin className="w-4 h-4 mr-1" />
                                                        {application.propertyAddress}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {application.applicationType} Application
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(application.status)}
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Application Info */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <h4 className="font-semibold text-gray-800 mb-2">Application Details</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <p><span className="font-medium">Submitted:</span> {new Date(application.submittedDate).toLocaleDateString()}</p>
                                                        <p><span className="font-medium">Agent:</span> {application.agentName}</p>
                                                        <p><span className="font-medium">Email:</span> {application.agentEmail}</p>
                                                        {application.applicationType === "Rental" ? (
                                                            <>
                                                                <p><span className="font-medium">Monthly Rent:</span> {application.monthlyRent}</p>
                                                                <p><span className="font-medium">Lease Term:</span> {application.leaseTerm}</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <p><span className="font-medium">Purchase Price:</span> {application.purchasePrice}</p>
                                                                <p><span className="font-medium">Down Payment:</span> {application.downPayment}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 rounded-lg p-4">
                                                    <h4 className="font-semibold text-gray-800 mb-2">Documents Status</h4>
                                                    <div className="space-y-2">
                                                        {application.documents.map((doc, index) => (
                                                            <div key={index} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-700">{doc.name}</span>
                                                                {getDocumentStatusIcon(doc.status)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {application.notes && (
                                                <div className={`rounded-lg p-3 ${
                                                    application.status === 'approved' ? 'bg-green-50' :
                                                    application.status === 'rejected' ? 'bg-red-50' : 'bg-yellow-50'
                                                }`}>
                                                    <p className="text-sm text-gray-700">
                                                        <span className="font-medium">Status Update:</span> {application.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex space-x-3">
                                                <button className="flex items-center space-x-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors">
                                                    <FiEye className="w-4 h-4" />
                                                    <span>View Details</span>
                                                </button>
                                                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                                                    <FiDownload className="w-4 h-4" />
                                                    <span>Download Documents</span>
                                                </button>
                                                {application.status === 'pending' && (
                                                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                        <FiFileText className="w-4 h-4" />
                                                        <span>Upload Additional Docs</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredApplications.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <FiFileText className="w-16 h-16 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No applications found</h3>
                                <p className="text-gray-500">There are no applications matching your current filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout1>
    )
}

export default HomeSeekerApplications 