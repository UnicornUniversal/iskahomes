"use client"
import React, { useState } from 'react'
import { agentReviews } from '../Data/Data'
import { FiStar, FiUser, FiMail, FiCalendar, FiFilter, FiSearch } from 'react-icons/fi'

const AgentReviews = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRating, setSelectedRating] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  // Filter reviews based on search term and rating
  const filteredReviews = agentReviews.filter(review => {
    const matchesSearch = review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.review.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = selectedRating === 'all' || review.stars === parseInt(selectedRating)
    return matchesSearch && matchesRating
  })

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date)
      case 'rating':
        return b.stars - a.stars
      case 'name':
        return a.reviewerName.localeCompare(b.reviewerName)
      default:
        return 0
    }
  })

  // Calculate average rating
  const averageRating = agentReviews.reduce((sum, review) => sum + review.stars, 0) / agentReviews.length

  // Calculate rating distribution
  const ratingDistribution = {
    5: agentReviews.filter(r => r.stars === 5).length,
    4: agentReviews.filter(r => r.stars === 4).length,
    3: agentReviews.filter(r => r.stars === 3).length,
    2: agentReviews.filter(r => r.stars === 2).length,
    1: agentReviews.filter(r => r.stars === 1).length
  }

  // Star rating component
  const StarRating = ({ rating, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Reviews</h1>
        <p className="text-gray-600">See what clients are saying about your services</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{agentReviews.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <FiStar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                <StarRating rating={Math.round(averageRating)} size="sm" />
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <FiStar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">5-Star Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{ratingDistribution[5]}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
              <FiStar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">4-Star Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{ratingDistribution[4]}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <FiStar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium text-gray-700">{rating}</span>
                <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{
                    width: `${(ratingDistribution[rating] / agentReviews.length) * 100}%`
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {ratingDistribution[rating]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reviews by name or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary_color focus:border-transparent transition-all duration-200"
            >
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Section - Review Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {review.reviewerName}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <FiMail className="w-4 h-4" />
                        {review.reviewerEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        {new Date(review.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <StarRating rating={review.stars} size="lg" />
                  </div>
                </div>

                {/* Review Text */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">{review.review}</p>
                </div>
              </div>

              {/* Right Section - Rating Badge */}
              <div className="lg:w-32 flex-shrink-0">
                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 text-white text-center">
                  <div className="text-2xl font-bold mb-1">{review.stars}</div>
                  <div className="text-sm opacity-90">Stars</div>
                  <div className="mt-2">
                    <StarRating rating={review.stars} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sortedReviews.length === 0 && (
        <div className="text-center py-12">
          <FiStar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}

export default AgentReviews
