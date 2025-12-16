'use client'

import React, { useState } from 'react'
import Layout1 from '../../../layout/Layout1'
import HomeSeekerHeader from '../../../components/homeSeeker/HomeSeekerHeader'
import HomeSeekerNav from '../../../components/homeSeeker/HomeSeekerNav'
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
                return 'bg-primary_color/10 text-primary_color border-primary_color/20'
            case 'pending':
                return 'bg-secondary_color/10 text-secondary_color border-secondary_color/20'
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
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
        <>
            <HomeSeekerHeader />
            
            <div className="mt-6 lg:mt-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-primary_color mb-2 flex items-center gap-3">
                            <div className="p-2 bg-primary_color/10 rounded-lg">
                                <FiFileText className="w-6 h-6 text-primary_color" />
                            </div>
                            My Applications
                        </h2>
                        <p className="text-primary_color/60 text-sm">Track your property applications</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                    activeFilter === filter
                                        ? 'bg-primary_color text-white shadow-lg shadow-primary_color/20'
                                        : 'default_bg text-primary_color hover:bg-primary_color/10 border border-primary_color/10'
                                }`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {filteredApplications.map((application) => (
                        <div key={application.id} className="default_bg rounded-2xl shadow-lg p-6 border border-primary_color/10 hover:shadow-xl transition-all duration-300">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Property Image */}
                                <div className="lg:w-1/4 flex-shrink-0">
                                    <img
                                        src={application.propertyImage}
                                        alt={application.propertyName}
                                        className="w-full h-48 lg:h-40 object-cover rounded-xl"
                                    />
                                </div>

                                {/* Application Details */}
                                <div className="lg:w-3/4 space-y-4 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-primary_color mb-2">
                                                {application.propertyName}
                                            </h3>
                                            <p className="text-primary_color/70 flex items-center mb-2">
                                                <FiMapPin className="w-4 h-4 mr-1.5" />
                                                {application.propertyAddress}
                                            </p>
                                            <span className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-primary_color/10 text-primary_color border border-primary_color/20">
                                                {application.applicationType} Application
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(application.status)}
                                            <span className={`px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(application.status)}`}>
                                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Application Info */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="default_bg rounded-xl p-4 border border-primary_color/10">
                                            <h4 className="font-bold text-primary_color mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-primary_color rounded-full"></div>
                                                Application Details
                                            </h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-primary_color/80"><span className="font-medium text-primary_color">Submitted:</span> {new Date(application.submittedDate).toLocaleDateString()}</p>
                                                <p className="text-primary_color/80"><span className="font-medium text-primary_color">Agent:</span> {application.agentName}</p>
                                                <p className="text-primary_color/80"><span className="font-medium text-primary_color">Email:</span> {application.agentEmail}</p>
                                                {application.applicationType === "Rental" ? (
                                                    <>
                                                        <p className="text-primary_color/80"><span className="font-medium text-primary_color">Monthly Rent:</span> {application.monthlyRent}</p>
                                                        <p className="text-primary_color/80"><span className="font-medium text-primary_color">Lease Term:</span> {application.leaseTerm}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-primary_color/80"><span className="font-medium text-primary_color">Purchase Price:</span> {application.purchasePrice}</p>
                                                        <p className="text-primary_color/80"><span className="font-medium text-primary_color">Down Payment:</span> {application.downPayment}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="default_bg rounded-xl p-4 border border-secondary_color/10">
                                            <h4 className="font-bold text-primary_color mb-3 flex items-center gap-2">
                                                <div className="w-1 h-4 bg-secondary_color rounded-full"></div>
                                                Documents Status
                                            </h4>
                                            <div className="space-y-2">
                                                {application.documents.map((doc, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm py-1">
                                                        <span className="text-primary_color/80">{doc.name}</span>
                                                        {getDocumentStatusIcon(doc.status)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {application.notes && (
                                        <div className={`rounded-xl p-4 border ${
                                            application.status === 'approved' ? 'bg-primary_color/5 border-primary_color/20' :
                                            application.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-secondary_color/5 border-secondary_color/20'
                                        }`}>
                                            <p className="text-sm text-primary_color/80">
                                                <span className="font-bold text-primary_color">Status Update:</span> {application.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3 pt-2">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-primary_color text-white rounded-lg hover:bg-primary_color/90 transition-colors shadow-lg shadow-primary_color/20">
                                            <FiEye className="w-4 h-4" />
                                            <span>View Details</span>
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 default_bg text-primary_color rounded-lg hover:bg-primary_color/10 transition-colors border border-primary_color/10">
                                            <FiDownload className="w-4 h-4" />
                                            <span>Download Documents</span>
                                        </button>
                                        {application.status === 'pending' && (
                                            <button className="flex items-center gap-2 px-4 py-2 bg-secondary_color text-white rounded-lg hover:bg-secondary_color/90 transition-colors shadow-lg shadow-secondary_color/20">
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
                    <div className="text-center py-16 default_bg rounded-2xl border border-primary_color/10">
                        <div className="text-primary_color/30 mb-4">
                            <FiFileText className="w-20 h-20 mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-primary_color mb-2">No applications found</h3>
                        <p className="text-primary_color/60">There are no applications matching your current filter.</p>
                    </div>
                )}
            </div>
        </>
    )
}

export default HomeSeekerApplications 