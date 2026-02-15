import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Only handle POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body = await req.json()
    const { amount, currency, network, address } = body

    // Validate required fields
    if (!amount || !currency || !network || !address) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate amount is positive
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create deposit request
    const { data: depositRequest, error: dbError } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email,
        amount: parseFloat(amount),
        currency,
        network,
        address,
        status: 'Pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to create deposit request', details: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        admin_id: user.id,
        action_type: 'deposit_request',
        target_user_id: user.id,
        target_resource_id: depositRequest.id,
        resource_type: 'deposit_request',
        action_details: {
          amount: parseFloat(amount),
          currency,
          network,
          address
        },
        created_at: new Date().toISOString()
      })

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Deposit request created successfully',
      data: depositRequest 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Deposit request error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
