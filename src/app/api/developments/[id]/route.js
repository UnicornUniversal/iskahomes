import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// Helper function to update developer's total_developments count
async function updateDeveloperTotalDevelopments(developerIdFromRequest) {
  try {
    // Get developer record by developer_id (which matches the developer_id in developments table)
    const { data: developer, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, developer_id')
      .eq('developer_id', developerIdFromRequest)
      .single()

    if (devError || !developer) {
      console.error('Error fetching developer for total_developments update:', devError)
      return
    }

    // Count developments where developer_id matches the developer_id from request
    // Note: developments.developer_id stores developers.developer_id (not developers.id)
    const { count: totalDevelopmentsCount, error: countError } = await supabaseAdmin
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerIdFromRequest)

    if (countError) {
      console.error('Error counting developments:', countError)
      return
    }

    // Update developer's total_developments
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({ total_developments: totalDevelopmentsCount || 0 })
      .eq('id', developer.id)

    if (updateError) {
      console.error('Error updating developer total_developments:', updateError)
    } else {
      console.log('✅ Developer total_developments updated:', {
        developer_id: developerIdFromRequest,
        total_developments: totalDevelopmentsCount || 0
      })
    }
  } catch (error) {
    console.error('Error in updateDeveloperTotalDevelopments:', error)
  }
}

// GET - Fetch a specific development
export async function GET(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Fetch the development
    const { data: development, error } = await supabase
      .from('developments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching development:', error)
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    // Check if the developer owns this development
    if (development.developer_id !== decoded.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to development' },
        { status: 403 }
      )
    }

    return NextResponse.json({ data: development })

  } catch (error) {
    console.error('Get development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get developer's primary currency
async function getDeveloperPrimaryCurrency(userId) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('developers')
      .select('company_locations, default_currency')
      .eq('developer_id', userId)
      .single()

    if (error || !profile) {
      console.error('Error fetching developer currency:', error)
      return 'USD' // Default
    }

    if (profile.company_locations && Array.isArray(profile.company_locations)) {
      const primaryLocation = profile.company_locations.find(
        loc => loc.primary_location === true
      )
      if (primaryLocation?.currency) {
        return primaryLocation.currency
      }
    }

    if (profile.default_currency?.code) {
      return profile.default_currency.code
    }

    return 'USD' // Default
  } catch (error) {
    console.error('Error in getDeveloperPrimaryCurrency:', error)
    return 'USD'
  }
}

// Helper function to create sales_listings entry
async function createSalesListingEntry(listingId, userId, listingData, saleType) {
  try {
    // Get primary currency
    const primaryCurrency = await getDeveloperPrimaryCurrency(userId)
    
    // Extract estimated_revenue value (in primary currency)
    const estimatedRevenue = listingData.estimated_revenue || {}
    const salePrice = estimatedRevenue.estimated_revenue || estimatedRevenue.price || 0
    
    if (!salePrice || salePrice <= 0) {
      console.error('No sale price available for sales_listings entry')
      return null
    }

    const salesEntry = {
      listing_id: listingId,
      user_id: userId || null,
      sale_price: parseFloat(salePrice.toFixed(2)),
      currency: primaryCurrency,
      sale_type: saleType, // 'sold' or 'rented'
      sale_date: new Date().toISOString().split('T')[0], // Today's date
      sale_timestamp: new Date().toISOString(),
      sale_source: 'Iska Homes', // Default
      buyer_name: null,
      notes: null,
      commission_rate: null,
      commission_amount: null
    }

    const { data, error } = await supabaseAdmin
      .from('sales_listings')
      .insert([salesEntry])
      .select()
      .single()

    if (error) {
      console.error('Error creating sales_listings entry:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createSalesListingEntry:', error)
    return null
  }
}

// Helper function to recalculate developer totals from sales_listings
async function recalculateDeveloperTotals(developerId) {
  try {
    // Get all sales for this developer from sales_listings
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('sales_listings')
      .select('sale_price')
      .eq('user_id', developerId)

    if (salesError) {
      console.error('Error fetching sales for developer:', salesError)
      return
    }

    // Calculate totals
    const totalSales = sales?.length || 0
    const totalRevenue = sales?.reduce((sum, sale) => {
      const price = typeof sale.sale_price === 'number' ? sale.sale_price : parseFloat(sale.sale_price || 0)
      return sum + price
    }, 0) || 0

    // Update developer table
    const { error: updateError } = await supabaseAdmin
      .from('developers')
      .update({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        updated_at: new Date().toISOString()
      })
      .eq('developer_id', developerId)

    if (updateError) {
      console.error('Error updating developer totals:', updateError)
    } else {
      console.log('✅ Developer totals recalculated:', {
        developer_id: developerId,
        total_sales: totalSales,
        total_revenue: totalRevenue
      })
    }
  } catch (error) {
    console.error('Error in recalculateDeveloperTotals:', error)
  }
}

// PUT - Update a development
export async function PUT(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams
    const body = await request.json()

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // First check if the development exists and belongs to the developer
    const { data: existingDevelopment, error: fetchError } = await supabase
      .from('developments')
      .select('developer_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    if (existingDevelopment.developer_id !== decoded.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to development' },
        { status: 403 }
      )
    }

    // Check if status is being changed to "Sold Out"
    const isStatusChangingToSoldOut = body.status === 'Sold Out' && existingDevelopment.status !== 'Sold Out'

    // Update the development
    const { data: development, error } = await supabase
      .from('developments')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating development:', error)
      return NextResponse.json(
        { error: 'Failed to update development' },
        { status: 500 }
      )
    }

    // If status changed to "Sold Out", update all listings and create sales records
    if (isStatusChangingToSoldOut) {
      try {
        // Fetch all listings for this development that are NOT already Sold Out, Taken, or Rented Out
        const { data: listings, error: listingsError } = await supabaseAdmin
          .from('listings')
          .select('id, purposes, estimated_revenue, status')
          .eq('development_id', id)
          .eq('account_type', 'developer')
          .not('status', 'eq', 'Sold Out')
          .not('status', 'eq', 'Taken')
          .not('status', 'eq', 'Rented Out')

        if (listingsError) {
          console.error('Error fetching listings:', listingsError)
        } else if (listings && listings.length > 0) {
          let listingsUpdated = 0
          let salesCreated = 0

          // Process each listing
          for (const listing of listings) {
            // Check purposes array to determine if it's for sale or rent
            const purposes = Array.isArray(listing.purposes) ? listing.purposes : []
            const purposeIds = purposes.map(p => typeof p === 'object' ? p.id : p)
            
            let newStatus = null
            let saleType = null

            // Check if listing has 'pur-sale' purpose
            if (purposeIds.includes('pur-sale')) {
              newStatus = 'Sold Out'
              saleType = 'sold'
            }
            // Check if listing has 'pur-rent' purpose
            else if (purposeIds.includes('pur-rent')) {
              newStatus = 'Rented Out'
              saleType = 'rented'
            }

            // Update listing status if we determined a new status
            if (newStatus && saleType) {
              // Update listing status
              const { error: updateError } = await supabaseAdmin
                .from('listings')
                .update({
                  status: newStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', listing.id)

              if (!updateError) {
                listingsUpdated++

                // Create sales_listings entry
                const salesEntry = await createSalesListingEntry(
                  listing.id,
                  decoded.developer_id,
                  listing,
                  saleType
                )

                if (salesEntry) {
                  salesCreated++
                }
              } else {
                console.error('Error updating listing status:', updateError)
              }
            }
          }

          // Recalculate developer totals from sales_listings table
          await recalculateDeveloperTotals(decoded.developer_id)

          console.log('✅ Development marked as Sold Out:', {
            development_id: id,
            listingsUpdated,
            salesCreated
          })

          return NextResponse.json({ 
            success: true, 
            data: development,
            message: 'Development updated successfully',
            listingsUpdated,
            salesCreated
          })
        }
      } catch (error) {
        console.error('Error processing sold out listings:', error)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: development,
      message: 'Development updated successfully' 
    })

  } catch (error) {
    console.error('Update development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a development
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { id } = resolvedParams

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // First check if the development exists and belongs to the developer
    const { data: existingDevelopment, error: fetchError } = await supabase
      .from('developments')
      .select('developer_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Development not found' },
        { status: 404 }
      )
    }

    if (existingDevelopment.developer_id !== decoded.developer_id) {
      return NextResponse.json(
        { error: 'Unauthorized access to development' },
        { status: 403 }
      )
    }

    // Store developer_id before deletion for updating total_developments
    const developerIdToUpdate = existingDevelopment.developer_id

    // Delete the development
    const { error } = await supabase
      .from('developments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting development:', error)
      return NextResponse.json(
        { error: 'Failed to delete development' },
        { status: 500 }
      )
    }

    // Update developer's total_developments count
    await updateDeveloperTotalDevelopments(developerIdToUpdate)

    return NextResponse.json({ 
      success: true,
      message: 'Development deleted successfully' 
    })

  } catch (error) {
    console.error('Delete development error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
