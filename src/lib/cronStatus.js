// Helper functions for managing analytics cron status
import { supabaseAdmin } from './supabase'
import crypto from 'crypto'

/**
 * Create a new cron run record
 */
export async function createRunRecord(data) {
  const runId = data.run_id || crypto.randomUUID()
  
  const { data: run, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .insert({
      run_id: runId,
      status: 'running',
      start_time: data.start_time,
      end_time: data.end_time,
      target_date: data.target_date,
      run_type: data.run_type || 'scheduled',
      started_at: new Date().toISOString(),
      ...data
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating run record:', error)
    throw error
  }
  
  return run
}

/**
 * Update run progress
 */
export async function updateRunProgress(runId, updates) {
  const { error } = await supabaseAdmin
    .from('analytics_cron_status')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('run_id', runId)

  if (error) {
    console.error('Error updating run progress:', error)
    throw error
  }
}

/**
 * Mark run as completed
 */
export async function completeRun(runId, stats) {
  const run = await getRunById(runId)
  if (!run) {
    throw new Error(`Run ${runId} not found`)
  }

  const startedAt = new Date(run.started_at)
  const completedAt = new Date()
  const durationSeconds = Math.floor((completedAt - startedAt) / 1000)

  const { error } = await supabaseAdmin
    .from('analytics_cron_status')
    .update({
      status: 'completed',
      completed_at: completedAt.toISOString(),
      duration_seconds: durationSeconds,
      ...stats
    })
    .eq('run_id', runId)

  if (error) {
    console.error('Error completing run:', error)
    throw error
  }
}

/**
 * Mark run as failed
 */
export async function failRun(runId, error) {
  const run = await getRunById(runId)
  if (!run) {
    throw new Error(`Run ${runId} not found`)
  }

  const errorDetails = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }

  const { error: updateError } = await supabaseAdmin
    .from('analytics_cron_status')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      last_error: error.message,
      error_details: errorDetails,
      error_count: (run.error_count || 0) + 1
    })
    .eq('run_id', runId)

  if (updateError) {
    console.error('Error failing run:', updateError)
    throw updateError
  }
}

/**
 * Get run by ID
 */
export async function getRunById(runId) {
  const { data, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .select('*')
    .eq('run_id', runId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw error
  }
  
  return data
}

/**
 * Get last successful run
 */
export async function getLastSuccessfulRun() {
  const { data, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }
  
  return data
}

/**
 * Get incomplete runs (running, failed, partial)
 */
export async function getIncompleteRuns() {
  const { data, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .select('*')
    .in('status', ['running', 'failed', 'partial'])
    .order('started_at', { ascending: false })

  if (error) {
    throw error
  }
  
  return data || []
}

/**
 * Get stuck runs (running for more than 2 hours)
 */
export async function getStuckRuns() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  
  const { data, error } = await supabaseAdmin
    .from('analytics_cron_status')
    .select('*')
    .eq('status', 'running')
    .lt('started_at', twoHoursAgo.toISOString())

  if (error) {
    throw error
  }
  
  return data || []
}

