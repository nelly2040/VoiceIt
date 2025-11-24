import { supabase } from '../config/supabase.js'

export class DatabaseService {
  // User operations
  static async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error('Create user error:', error)
      throw error
    }
    return data
  }

  static async findUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      console.error('Find user by email error:', error)
      throw error
    }
    return data
  }

  static async findUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Find user by id error:', error)
      throw error
    }
    return data
  }

  // Issue operations
  static async createIssue(issueData) {
    const { data, error } = await supabase
      .from('issues')
      .insert([issueData])
      .select(`
        *,
        users:reporter_id (id, name, email)
      `)
      .single()

    if (error) {
      console.error('Create issue error:', error)
      throw error
    }
    return data
  }

  static async getAllIssues() {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        users:reporter_id (id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get all issues error:', error)
      throw error
    }
    return data
  }

  static async getIssueById(id) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        users:reporter_id (id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Get issue by id error:', error)
      throw error
    }
    return data
  }

  
  static async updateIssueStatus(id, status) {
  try {
    console.log('🔄 Updating issue status:', { id, status })
    
    const { data, error } = await supabase
      .from('issues')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        users:reporter_id (id, name, email)
      `)
      .single()

    if (error) {
      console.error('❌ Error updating issue status:', error)
      throw error
    }

    console.log('✅ Issue status updated successfully')
    return data
  } catch (error) {
    console.error('❌ Update issue status error:', error)
    throw error
  }
}

// Upvote operations
static async toggleUpvote(issueId, userId) {
  try {
    console.log('🔄 Toggling upvote for issue:', issueId, 'by user:', userId)
    
    // Check if user already upvoted
    const { data: existingUpvote, error: checkError } = await supabase
      .from('upvotes')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking upvote:', checkError)
      throw checkError
    }

    if (existingUpvote) {
      console.log('🗑️ Removing upvote')
      // Remove upvote
      const { error: deleteError } = await supabase
        .from('upvotes')
        .delete()
        .eq('id', existingUpvote.id)

      if (deleteError) {
        console.error('❌ Error deleting upvote:', deleteError)
        throw deleteError
      }

      // Get current upvotes count
      const { data: currentIssue, error: getError } = await supabase
        .from('issues')
        .select('upvotes')
        .eq('id', issueId)
        .single()

      if (getError) throw getError

      // Decrement upvotes count
      const { data: issue, error: updateError } = await supabase
        .from('issues')
        .update({ 
          upvotes: Math.max(0, (currentIssue.upvotes || 0) - 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', issueId)
        .select(`
          *,
          users:reporter_id (id, name, email)
        `)
        .single()

      if (updateError) {
        console.error('❌ Error decrementing upvotes:', updateError)
        throw updateError
      }

      console.log('✅ Upvote removed successfully')
      return issue
    } else {
      console.log('➕ Adding upvote')
      // Add upvote
      const { error: insertError } = await supabase
        .from('upvotes')
        .insert([{ 
          issue_id: issueId, 
          user_id: userId 
        }])

      if (insertError) {
        console.error('❌ Error inserting upvote:', insertError)
        throw insertError
      }

      // Get current upvotes count
      const { data: currentIssue, error: getError } = await supabase
        .from('issues')
        .select('upvotes')
        .eq('id', issueId)
        .single()

      if (getError) throw getError

      // Increment upvotes count
      const { data: issue, error: updateError } = await supabase
        .from('issues')
        .update({ 
          upvotes: (currentIssue.upvotes || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', issueId)
        .select(`
          *,
          users:reporter_id (id, name, email)
        `)
        .single()

      if (updateError) {
        console.error('❌ Error incrementing upvotes:', updateError)
        throw updateError
      }

      console.log('✅ Upvote added successfully')
      return issue
    }
  } catch (error) {
    console.error('❌ Toggle upvote error:', error)
    throw error
  }
}

  // Comment operations
  static async addComment(issueId, userId, text) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        issue_id: issueId,
        user_id: userId,
        text: text
      }])
      .select(`
        *,
        users:user_id (id, name)
      `)
      .single()

    if (error) {
      console.error('Add comment error:', error)
      throw error
    }
    return data
  }

  static async getUserIssues(userId) {
    const { data, error } = await supabase
      .from('issues')
      .select(`
        *,
        users:reporter_id (id, name, email)
      `)
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get user issues error:', error)
      throw error
    }
    return data
  }

  // Get comments for an issue
  static async getIssueComments(issueId) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (id, name)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Get issue comments error:', error)
      throw error
    }
    return data
  }
}