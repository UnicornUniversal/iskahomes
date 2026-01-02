import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// Helper function to upload files to Supabase Storage
async function uploadFile(file, folder, subfolder) {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('iskaHomes')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('iskaHomes')
      .getPublicUrl(filePath)

    return {
      id: data.id,
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}

// Helper function to delete files from Supabase Storage
async function deleteFile(filePath) {
  try {
    const { error } = await supabaseAdmin.storage
      .from('iskaHomes')
      .remove([filePath])

    if (error) {
      console.error('File deletion error:', error)
      // Don't throw - file might not exist
    }
  } catch (error) {
    console.error('File deletion error:', error)
  }
}

// GET - Fetch transaction records with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listing_id')
    const agentId = searchParams.get('agent_id')
    const agencyId = searchParams.get('agency_id')
    const transactionType = searchParams.get('transaction_type')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('payment_status')
    const search = searchParams.get('search') // Search by customer name, phone, or notes
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Build query
    let query = supabaseAdmin
      .from('transaction_records')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (listingId) {
      query = query.eq('listing_id', listingId)
    }
    if (agentId) {
      query = query.eq('agent_id', agentId)
    }
    if (agencyId) {
      query = query.eq('agency_id', agencyId)
    }
    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus)
    }

    // Search filter (customer name, phone, or notes)
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching transaction records:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transaction records', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new transaction record
export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user type and agent/agency info
    const userType = decoded.user_type
    let agentId = null
    let agencyId = null

    if (userType === 'agent') {
      const { data: agentData, error: agentError } = await supabaseAdmin
        .from('agents')
        .select('id, agency_id')
        .eq('agent_id', decoded.user_id)
        .single()

      if (agentError || !agentData) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      agentId = agentData.id
      
      // Get the agency's primary key (id) from agencies table using agency_id
      const { data: agencyData, error: agencyLookupError } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', agentData.agency_id)
        .single()

      if (agencyLookupError || !agencyData) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
      }

      agencyId = agencyData.id
    } else if (userType === 'agency') {
      const { data: agencyData, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', decoded.user_id)
        .single()

      if (agencyError || !agencyData) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
      }

      agencyId = agencyData.id
    } else {
      return NextResponse.json({ error: 'Unauthorized user type' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    
    // Extract transaction data
    const transactionData = {
      listing_id: formData.get('listing_id') || null,
      agent_id: agentId,
      agency_id: agencyId,
      user_id: formData.get('user_id') || null,
      sale_listing_id: formData.get('sale_listing_id') || null,
      transaction_type: formData.get('transaction_type'),
      category: formData.get('category') || null, // This is the property_purpose UUID
      subcategory: formData.get('subcategory') || null,
      amount: formData.get('amount') ? parseFloat(formData.get('amount')) : null,
      currency: formData.get('currency') || 'USD',
      payment_method: formData.get('payment_method') || null,
      payment_status: formData.get('payment_status') || 'pending',
      transaction_reference: formData.get('transaction_reference') || null,
      payment_date: formData.get('payment_date') || null,
      due_date: formData.get('due_date') || null,
      check_in_date: formData.get('check_in_date') || null,
      check_out_date: formData.get('check_out_date') || null,
      rent_due_date: formData.get('rent_due_date') || null,
      period_start: formData.get('period_start') || null,
      period_end: formData.get('period_end') || null,
      is_recurring: formData.get('is_recurring') === 'true',
      recurring_period: formData.get('recurring_period') || null,
      recurring_frequency: formData.get('recurring_frequency') ? parseInt(formData.get('recurring_frequency')) : null,
      parent_transaction_id: formData.get('parent_transaction_id') || null,
      customer_name: formData.get('customer_name') || null,
      customer_first_name: formData.get('customer_first_name') || null,
      customer_last_name: formData.get('customer_last_name') || null,
      customer_email: formData.get('customer_email') || null,
      customer_phone: formData.get('customer_phone') || null,
      customer_secondary_phone: formData.get('customer_secondary_phone') || null,
      customer_address: formData.get('customer_address') || null,
      customer_id_type: formData.get('customer_id_type') || null,
      customer_id_number: formData.get('customer_id_number') || null,
      notes: formData.get('notes') || null,
      description: formData.get('description') || null,
      internal_notes: formData.get('internal_notes') || null,
      status: formData.get('status') || 'pending',
      is_overdue: formData.get('is_overdue') === 'true',
      overdue_days: formData.get('overdue_days') ? parseInt(formData.get('overdue_days')) : 0,
      verified: formData.get('verified') === 'true',
      verified_by: formData.get('verified_by') || null,
      verified_at: formData.get('verified_at') || null,
      exchange_rate: formData.get('exchange_rate') ? parseFloat(formData.get('exchange_rate')) : null,
      converted_amount: formData.get('converted_amount') ? parseFloat(formData.get('converted_amount')) : null,
      late_fee: formData.get('late_fee') ? parseFloat(formData.get('late_fee')) : null,
      discount: formData.get('discount') ? parseFloat(formData.get('discount')) : null,
      net_amount: formData.get('net_amount') ? parseFloat(formData.get('net_amount')) : null,
      created_by: agentId,
      last_modified_by: agentId,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags')) : []
    }

    // Validate required fields
    if (!transactionData.transaction_type) {
      return NextResponse.json({ error: 'Transaction type is required' }, { status: 400 })
    }
    if (!transactionData.customer_name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!transactionData.customer_phone) {
      return NextResponse.json({ error: 'Customer phone is required' }, { status: 400 })
    }

    // Handle file uploads - Receipt Images
    const receiptImages = []
    const receiptImageFiles = formData.getAll('receipt_images')
    for (const file of receiptImageFiles) {
      if (file instanceof File && file.size > 0) {
        try {
          const uploadedFile = await uploadFile(file, 'transactions', 'receipts')
          receiptImages.push(uploadedFile)
        } catch (error) {
          console.error('Error uploading receipt image:', error)
          // Continue with other files even if one fails
        }
      }
    }

    // Handle file uploads - Additional Documents
    const additionalDocuments = []
    const documentFiles = formData.getAll('additional_documents')
    for (const file of documentFiles) {
      if (file instanceof File && file.size > 0) {
        try {
          const uploadedFile = await uploadFile(file, 'transactions', 'documents')
          additionalDocuments.push(uploadedFile)
        } catch (error) {
          console.error('Error uploading document:', error)
          // Continue with other files even if one fails
        }
      }
    }

    // Handle customer ID document upload
    let customerIdDocument = null
    const idDocumentFile = formData.get('customer_id_document')
    if (idDocumentFile instanceof File && idDocumentFile.size > 0) {
      try {
        customerIdDocument = await uploadFile(idDocumentFile, 'transactions', 'id-documents')
      } catch (error) {
        console.error('Error uploading ID document:', error)
      }
    }

    // Add file data to transaction
    transactionData.receipt_images = receiptImages.length > 0 ? receiptImages : []
    transactionData.additional_documents = additionalDocuments.length > 0 ? additionalDocuments : []
    transactionData.customer_id_document = customerIdDocument

    // Calculate overdue days if due_date is set and payment_date is not
    if (transactionData.due_date && !transactionData.payment_date) {
      const dueDate = new Date(transactionData.due_date)
      const today = new Date()
      if (dueDate < today) {
        transactionData.is_overdue = true
        transactionData.overdue_days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
      }
    }

    // Insert transaction record
    const { data: newTransaction, error: insertError } = await supabaseAdmin
      .from('transaction_records')
      .insert(transactionData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating transaction record:', insertError)
      
      // Cleanup uploaded files if insert fails
      receiptImages.forEach(file => deleteFile(file.path))
      additionalDocuments.forEach(file => deleteFile(file.path))
      if (customerIdDocument) deleteFile(customerIdDocument.path)

      return NextResponse.json(
        { error: 'Failed to create transaction record', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction record created successfully',
      data: newTransaction
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

