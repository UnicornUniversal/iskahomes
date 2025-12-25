import { supabase, supabaseAdmin } from './supabase'

// Developer database operations
export const developerDB = {
  // Create a new developer record
  create: async (developerData) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .insert([developerData])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get developer by developer ID (Supabase user ID)
  getByUserId: async (userId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .select('*')
        .eq('developer_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get developer by developer ID
  getById: async (developerId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .select('*')
        .eq('id', developerId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Get developer by slug
  getBySlug: async (slug) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Update developer by developer_id (Supabase user ID)
  update: async (userId, updates) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('developers')
        .update(updates)
        .eq('developer_id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Delete developer by developer_id (Supabase user ID)
  delete: async (userId) => {
    try {
      const { error } = await supabaseAdmin
        .from('developers')
        .delete()
        .eq('developer_id', userId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }
}

// Agent database operations
export const agentDB = {
  create: async (agentData) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('agents')
        .insert([agentData])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  getByUserId: async (userId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('agents')
        .select('*')
        .eq('agent_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Home seeker database operations
export const homeSeekerDB = {
  create: async (seekerData) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('home_seekers')
        .insert([seekerData])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  getByUserId: async (userId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('home_seekers')
        .select('*')
        .eq('developer_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
