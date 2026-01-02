import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyToken } from '@/lib/jwt'

// Helper function to upload files to Supabase Storage
async function uploadFile(file, folder, subfolder) {
  try {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = `${folder}/${subfolder}/${fileName}`

    const fileBuffer = await file.arrayBuffer()

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
    }
  } catch (error) {
    console.error('File deletion error:', error)
  }
}

// GET - Fetch single transaction record
export async function GET(request, { params }) {
  try {
    const { id } = params
    const resolvedId = id instanceof Promise ? await id : id

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

    const { data, error } = await supabaseAdmin
      .from('transaction_records')
      .select('*')
      .eq('id', resolvedId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
      }
      console.error('Error fetching transaction record:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transaction record', details: error.message },
        { status: 500 }
      )
    }

    // Check authorization - user must be the agent or agency owner
    const userType = decoded.user_type
    if (userType === 'agent') {
      const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('id, agency_id')
        .eq('agent_id', decoded.user_id)
        .single()

      if (!agentData) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      // Get agency's primary key (id) for comparison
      const { data: agencyData } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', agentData.agency_id)
        .single()

      if (!agencyData || (data.agent_id !== agentData.id && data.agency_id !== agencyData.id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (userType === 'agency') {
      const { data: agencyData } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', decoded.user_id)
        .single()

      if (!agencyData || data.agency_id !== agencyData.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized user type' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update transaction record
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const resolvedId = id instanceof Promise ? await id : id

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

    // Get existing transaction
    const { data: existingTransaction, error: fetchError } = await supabaseAdmin
      .from('transaction_records')
      .select('*')
      .eq('id', resolvedId)
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
    }

    // Check authorization
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

      if (existingTransaction.agent_id !== agentId && existingTransaction.agency_id !== agencyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
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

      if (existingTransaction.agency_id !== agencyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized user type' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    
    // Build update data
    const updateData = {}
    
    // Only update fields that are provided
    const fields = [
      'listing_id', 'user_id', 'sale_listing_id', 'transaction_type', 'category', 'subcategory',
      'amount', 'currency', 'payment_method', 'payment_status', 'transaction_reference',
      'payment_date', 'due_date', 'check_in_date', 'check_out_date', 'rent_due_date',
      'period_start', 'period_end', 'is_recurring', 'recurring_period', 'recurring_frequency',
      'parent_transaction_id', 'customer_name', 'customer_first_name', 'customer_last_name',
      'customer_email', 'customer_phone', 'customer_secondary_phone', 'customer_address',
      'customer_id_type', 'customer_id_number', 'notes', 'description', 'internal_notes',
      'status', 'is_overdue', 'overdue_days', 'verified', 'verified_by', 'verified_at',
      'exchange_rate', 'converted_amount', 'late_fee', 'discount', 'net_amount', 'tags'
    ]

    fields.forEach(field => {
      const value = formData.get(field)
      if (value !== null) {
        if (field === 'amount' || field === 'exchange_rate' || field === 'converted_amount' || 
            field === 'late_fee' || field === 'discount' || field === 'net_amount') {
          updateData[field] = value ? parseFloat(value) : null
        } else if (field === 'is_recurring' || field === 'is_overdue' || field === 'verified') {
          updateData[field] = value === 'true'
        } else if (field === 'overdue_days' || field === 'recurring_frequency') {
          updateData[field] = value ? parseInt(value) : null
        } else if (field === 'tags') {
          updateData[field] = value ? JSON.parse(value) : []
        } else {
          updateData[field] = value || null
        }
      }
    })

    updateData.last_modified_by = agentId

    // Handle file uploads - Receipt Images
    const receiptImageFiles = formData.getAll('receipt_images')
    if (receiptImageFiles.length > 0) {
      const newReceiptImages = []
      const existingReceiptImages = existingTransaction.receipt_images || []

      for (const file of receiptImageFiles) {
        if (file instanceof File && file.size > 0) {
          try {
            const uploadedFile = await uploadFile(file, 'transactions', 'receipts')
            newReceiptImages.push(uploadedFile)
          } catch (error) {
            console.error('Error uploading receipt image:', error)
          }
        }
      }

      // Merge with existing images
      updateData.receipt_images = [...existingReceiptImages, ...newReceiptImages]
    }

    // Handle file uploads - Additional Documents
    const documentFiles = formData.getAll('additional_documents')
    if (documentFiles.length > 0) {
      const newDocuments = []
      const existingDocuments = existingTransaction.additional_documents || []

      for (const file of documentFiles) {
        if (file instanceof File && file.size > 0) {
          try {
            const uploadedFile = await uploadFile(file, 'transactions', 'documents')
            newDocuments.push(uploadedFile)
          } catch (error) {
            console.error('Error uploading document:', error)
          }
        }
      }

      // Merge with existing documents
      updateData.additional_documents = [...existingDocuments, ...newDocuments]
    }

    // Handle customer ID document upload
    const idDocumentFile = formData.get('customer_id_document')
    if (idDocumentFile instanceof File && idDocumentFile.size > 0) {
      try {
        updateData.customer_id_document = await uploadFile(idDocumentFile, 'transactions', 'id-documents')
      } catch (error) {
        console.error('Error uploading ID document:', error)
      }
    }

    // Handle file deletions (if files_to_delete is provided)
    const filesToDelete = formData.get('files_to_delete')
    if (filesToDelete) {
      try {
        const filesToDeleteArray = JSON.parse(filesToDelete)
        const filesToDeleteFromReceipts = filesToDeleteArray.receipt_images || []
        const filesToDeleteFromDocuments = filesToDeleteArray.additional_documents || []

        // Remove from receipt_images
        if (filesToDeleteFromReceipts.length > 0) {
          const currentReceipts = updateData.receipt_images || existingTransaction.receipt_images || []
          updateData.receipt_images = currentReceipts.filter(
            file => !filesToDeleteFromReceipts.includes(file.path)
          )
          // Delete files from storage
          filesToDeleteFromReceipts.forEach(path => deleteFile(path))
        }

        // Remove from additional_documents
        if (filesToDeleteFromDocuments.length > 0) {
          const currentDocuments = updateData.additional_documents || existingTransaction.additional_documents || []
          updateData.additional_documents = currentDocuments.filter(
            file => !filesToDeleteFromDocuments.includes(file.path)
          )
          // Delete files from storage
          filesToDeleteFromDocuments.forEach(path => deleteFile(path))
        }
      } catch (error) {
        console.error('Error processing file deletions:', error)
      }
    }

    // Calculate overdue days if due_date is set and payment_date is not
    if (updateData.due_date !== undefined || updateData.payment_date !== undefined) {
      const dueDate = updateData.due_date ? new Date(updateData.due_date) : new Date(existingTransaction.due_date)
      const paymentDate = updateData.payment_date ? new Date(updateData.payment_date) : existingTransaction.payment_date ? new Date(existingTransaction.payment_date) : null
      
      if (dueDate && !paymentDate) {
        const today = new Date()
        if (dueDate < today) {
          updateData.is_overdue = true
          updateData.overdue_days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
        } else {
          updateData.is_overdue = false
          updateData.overdue_days = 0
        }
      } else if (paymentDate) {
        updateData.is_overdue = false
        updateData.overdue_days = 0
      }
    }

    // Update transaction record
    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from('transaction_records')
      .update(updateData)
      .eq('id', resolvedId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating transaction record:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction record', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction record updated successfully',
      data: updatedTransaction
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete transaction record
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const resolvedId = id instanceof Promise ? await id : id

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

    // Get existing transaction
    const { data: existingTransaction, error: fetchError } = await supabaseAdmin
      .from('transaction_records')
      .select('*')
      .eq('id', resolvedId)
      .single()

    if (fetchError || !existingTransaction) {
      return NextResponse.json({ error: 'Transaction record not found' }, { status: 404 })
    }

    // Check authorization
    const userType = decoded.user_type
    if (userType === 'agent') {
      const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('id, agency_id')
        .eq('agent_id', decoded.user_id)
        .single()

      if (!agentData) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      // Get agency's primary key (id) for comparison
      const { data: agencyData } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', agentData.agency_id)
        .single()

      if (!agencyData || (existingTransaction.agent_id !== agentData.id && existingTransaction.agency_id !== agencyData.id)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (userType === 'agency') {
      const { data: agencyData } = await supabaseAdmin
        .from('agencies')
        .select('id')
        .eq('agency_id', decoded.user_id)
        .single()

      if (!agencyData || existingTransaction.agency_id !== agencyData.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized user type' }, { status: 403 })
    }

    // Delete associated files from storage
    if (existingTransaction.receipt_images) {
      existingTransaction.receipt_images.forEach(file => {
        if (file.path) deleteFile(file.path)
      })
    }
    if (existingTransaction.additional_documents) {
      existingTransaction.additional_documents.forEach(file => {
        if (file.path) deleteFile(file.path)
      })
    }
    if (existingTransaction.customer_id_document && existingTransaction.customer_id_document.path) {
      deleteFile(existingTransaction.customer_id_document.path)
    }

    // Delete transaction record
    const { error: deleteError } = await supabaseAdmin
      .from('transaction_records')
      .delete()
      .eq('id', resolvedId)

    if (deleteError) {
      console.error('Error deleting transaction record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete transaction record', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction record deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

