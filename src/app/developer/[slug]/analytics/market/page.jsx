'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  MapPin, 
  Building2, 
  Users, 
  DollarSign,
  Target,
  Globe
} from 'lucide-react'

const MarketAnalytics = () => {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  // Dummy data for market analytics
  const marketData = {
    overview: {
      marketShare: 4.2,
      competitiveIndex: 7.8,
      priceIndex: 1.2,
      demandIndex: 6.5,
      marketShareChange: 2.8,
      competitiveIndexChange: 1.5,
      priceIndexChange: -0.3,
      demandIndexChange: 3.2
    },
    marketTrends: [
      { 
        metric: 'Property Prices', 
        value: 1.2, 
        change: -0.3, 
        trend: 'down',
        description: 'Average property prices decreased by 0.3% this month'
      },
      { 
        metric: 'Demand Level', 
        value: 6.5, 
        change: 3.2, 
        trend: 'up',
        description: 'Property demand increased by 3.2% compared to last month'
      },
      { 
        metric: 'Market Competition', 
        value: 7.8, 
        change: 1.5, 
        trend: 'up',
        description: 'Competition level increased by 1.5 points'
      },
      { 
        metric: 'New Listings', 
        value: 23, 
        change: -8.2, 
        trend: 'down',
        description: 'New property listings decreased by 8.2%'
      }
    ],
    competitiveAnalysis: [
      { 
        competitor: 'Premium Properties Ltd', 
        marketShare: 8.5, 
        avgPrice: 450000, 
        listings: 45,
        rating: 4.8,
        strengths: ['Premium locations', 'High-end finishes'],
        weaknesses: ['Limited budget options', 'Slow response time']
      },
      { 
        competitor: 'Urban Developers', 
        marketShare: 6.2, 
        avgPrice: 320000, 
        listings: 38,
        rating: 4.5,
        strengths: ['Modern designs', 'Good pricing'],
        weaknesses: ['Limited locations', 'Average customer service']
      },
      { 
        competitor: 'Metro Real Estate', 
        marketShare: 5.8, 
        avgPrice: 380000, 
        listings: 42,
        rating: 4.3,
        strengths: ['Wide variety', 'Good marketing'],
        weaknesses: ['Inconsistent quality', 'Poor communication']
      }
    ],
    locationAnalysis: [
      { 
        area: 'East Legon', 
        avgPrice: 520000, 
        demand: 8.2, 
        competition: 7.5,
        growth: 12.3,
        properties: 15
      },
      { 
        area: 'Accra Central', 
        avgPrice: 380000, 
        demand: 6.8, 
        competition: 8.2,
        growth: 8.7,
        properties: 12
      },
      { 
        area: 'Tema', 
        avgPrice: 290000, 
        demand: 5.5, 
        competition: 6.1,
        growth: 15.2,
        properties: 8
      },
      { 
        area: 'Spintex', 
        avgPrice: 450000, 
        demand: 7.3, 
        competition: 7.8,
        growth: 9.8,
        properties: 10
      }
    ],
    marketInsights: [
      {
        type: 'opportunity',
        title: 'High Growth in Tema',
        description: 'Tema shows 15.2% growth with moderate competition. Consider expanding presence.',
        impact: 'high'
      },
      {
        type: 'threat',
        title: 'Increased Competition in East Legon',
        description: 'Competition in East Legon increased by 2.3 points. Focus on differentiation.',
        impact: 'medium'
      },
      {
        type: 'trend',
        title: 'Rising Demand for Mid-Range Properties',
        description: 'Properties in 300k-400k range showing 18% increase in inquiries.',
        impact: 'high'
      }
    ],
    priceAnalysis: {
      yourAvgPrice: 420000,
      marketAvgPrice: 380000,
      pricePosition: 'above',
      priceDifference: 10.5,
      priceRecommendation: 'Consider slight price adjustment to improve competitiveness'
    }
  }

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const getTrendIcon = (trend) => {
    return trend === 'up' ? TrendingUp : TrendingDown
  }

  const getTrendColor = (trend) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600'
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'opportunity': return 'bg-green-50 text-green-600'
      case 'threat': return 'bg-red-50 text-red-600'
      case 'trend': return 'bg-blue-50 text-blue-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/developer/${params.slug}/analytics`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Intelligence</h1>
          <p className="text-gray-600">Market trends, competitive analysis, and industry insights</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Share</p>
                <p className="text-2xl font-bold text-gray-900">{marketData.overview.marketShare}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {marketData.overview.marketShareChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${marketData.overview.marketShareChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(marketData.overview.marketShareChange)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Competitive Index</p>
                <p className="text-2xl font-bold text-gray-900">{marketData.overview.competitiveIndex}/10</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {marketData.overview.competitiveIndexChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${marketData.overview.competitiveIndexChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(marketData.overview.competitiveIndexChange)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Price Index</p>
                <p className="text-2xl font-bold text-gray-900">{marketData.overview.priceIndex}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {marketData.overview.priceIndexChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${marketData.overview.priceIndexChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(marketData.overview.priceIndexChange)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Demand Index</p>
                <p className="text-2xl font-bold text-gray-900">{marketData.overview.demandIndex}/10</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              {marketData.overview.demandIndexChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ml-1 ${marketData.overview.demandIndexChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(marketData.overview.demandIndexChange)}
              </span>
            </div>
          </div>
        </div>

        {/* Market Trends */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketData.marketTrends.map((trend, index) => {
              const TrendIcon = getTrendIcon(trend.trend)
              return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{trend.metric}</h4>
                    <div className="flex items-center space-x-2">
                      <TrendIcon className={`w-4 h-4 ${getTrendColor(trend.trend)}`} />
                      <span className={`text-sm ${getTrendColor(trend.trend)}`}>
                        {trend.change > 0 ? '+' : ''}{trend.change}%
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{trend.value}</div>
                  <p className="text-xs text-gray-600">{trend.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Competitive Analysis & Location Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Analysis</h3>
            <div className="space-y-4">
              {marketData.competitiveAnalysis.map((competitor, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{competitor.competitor}</h4>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{competitor.rating}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Market Share</div>
                      <div className="text-sm font-medium text-gray-900">{competitor.marketShare}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Avg Price</div>
                      <div className="text-sm font-medium text-gray-900">${competitor.avgPrice.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="mb-1">
                      <span className="font-medium text-green-600">Strengths:</span> {competitor.strengths.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Weaknesses:</span> {competitor.weaknesses.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Analysis</h3>
            <div className="space-y-4">
              {marketData.locationAnalysis.map((location, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{location.area}</h4>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{location.properties} properties</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <div className="text-xs text-gray-500">Avg Price</div>
                      <div className="text-sm font-medium text-gray-900">${location.avgPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Growth</div>
                      <div className="text-sm font-medium text-gray-900">{location.growth}%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Demand</div>
                      <div className="text-sm font-medium text-gray-900">{location.demand}/10</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Competition</div>
                      <div className="text-sm font-medium text-gray-900">{location.competition}/10</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
          <div className="space-y-4">
            {marketData.marketInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${getTypeColor(insight.type)}`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">${marketData.priceAnalysis.yourAvgPrice.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Your Average Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">${marketData.priceAnalysis.marketAvgPrice.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Market Average Price</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${marketData.priceAnalysis.pricePosition === 'above' ? 'text-red-600' : 'text-green-600'}`}>
                {marketData.priceAnalysis.priceDifference}%
              </div>
              <div className="text-sm text-gray-500">
                {marketData.priceAnalysis.pricePosition === 'above' ? 'Above Market' : 'Below Market'}
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Recommendation:</strong> {marketData.priceAnalysis.priceRecommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketAnalytics
