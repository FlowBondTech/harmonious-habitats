import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  inviteCode: string;
  recipients: string[];
  senderName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user profile for sender name
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const senderName = profile?.full_name || 'A friend'

    // Parse request body
    const { inviteCode, recipients }: RequestBody = await req.json()

    if (!inviteCode || !recipients || recipients.length === 0) {
      throw new Error('Missing required fields: inviteCode and recipients')
    }

    // Validate that the invite code belongs to the user and is active
    const { data: codeData, error: codeError } = await supabaseClient
      .from('invite_codes')
      .select('id, is_used, expires_at')
      .eq('code', inviteCode.toUpperCase())
      .eq('created_by', user.id)
      .eq('is_used', false)
      .single()

    if (codeError || !codeData) {
      throw new Error('Invalid or unauthorized invite code')
    }

    // Check if code is expired
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      throw new Error('Invite code has expired')
    }

    // Send emails using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('Resend API key not configured')
    }

    const emailPromises = recipients.map(async (email) => {
      const emailBody = {
        from: 'Holistic Spaces <invite@hp3.xyz>', // Replace with your verified domain
        to: [email],
        subject: `${senderName} invited you to join Holistic Spaces`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>You're invited to Holistic Spaces</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #688b61 0%, #507049 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
                .content { background: #f8f9fa; padding: 40px 20px; border-radius: 0 0 12px 12px; }
                .invite-code { background: #688b61; color: white; padding: 15px 25px; border-radius: 8px; font-family: monospace; font-size: 20px; letter-spacing: 2px; margin: 20px 0; display: inline-block; }
                .button { background: #688b61; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🌿 Welcome to Holistic Spaces</h1>
                  <p>You've been invited to join our mindful community</p>
                </div>
                <div class="content">
                  <h2>Hi there!</h2>
                  <p><strong>${senderName}</strong> has invited you to join <strong>Holistic Spaces</strong> - a beautiful platform for discovering and hosting mindful gatherings, wellness workshops, and holistic experiences.</p>
                  
                  <p>Here's your exclusive invite code:</p>
                  <div style="text-align: center;">
                    <span class="invite-code">${inviteCode.toLowerCase()}</span>
                  </div>
                  
                  <p>Use this code to create your account and start exploring:</p>
                  <ul>
                    <li>🧘 Mindfulness and meditation sessions</li>
                    <li>🌱 Wellness workshops and healing circles</li>
                    <li>🏡 Intimate gathering spaces in your community</li>
                    <li>🤝 Connect with like-minded individuals</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}" class="button">Join Holistic Spaces</a>
                  </div>
                  
                  <p><em>This invite code expires in 30 days, so don't wait too long to join us!</em></p>
                </div>
                <div class="footer">
                  <p>Holistic Spaces - Where mindful connections flourish</p>
                  <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                </div>
              </div>
            </body>
          </html>
        `
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to send email to ${email}: ${errorData}`)
      }

      return await response.json()
    })

    const results = await Promise.all(emailPromises)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully sent ${results.length} invite email(s)`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending invite emails:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})