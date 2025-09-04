import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use environment variable for AI21 API key
const ai21ApiKey = Deno.env.get('AI21_API_KEY') || 'ea7d40c6-ca1e-4c39-8622-b423702a95f5';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client for authenticated requests
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { message, conversationId } = await req.json();

    // Check if user has premium subscription
    const { data: subscription } = await supabaseClient
      .from('subscribers')
      .select('subscribed, subscription_tier')
      .eq('user_id', user.id)
      .single();

    const isPremium = subscription?.subscribed || false;
    const model = isPremium ? 'jamba-1.5-large' : 'jamba-1.5-mini'; // Updated to jamba-1.5-mini based on naming conventions

    // Get conversation history
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build message history for AI21
    const conversationMessages = [
      { 
        role: 'system', 
        content: 'You are ShadowAI, a helpful and intelligent assistant. Provide thoughtful, accurate responses while being conversational and engaging.' 
      },
      ...(messages || []),
      { role: 'user', content: message }
    ];

    // Combine messages into a single input string
    const combinedInput = conversationMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    console.log(`Using model: ${model} for user: ${user.id}`);

    // Call AI21 API
    const response = await fetch('https://api.ai21.com/studio/v1/maestro/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ai21ApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        models: [model], // Use array format as per Python SDK example
        input: combinedInput,
        output_type: { type: "string" },
        tools: [{ type: "web_search" }],
        max_tokens: isPremium ? 2000 : 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Parse JSON for detailed error
      console.error('AI21 API error:', JSON.stringify(errorData, null, 2));
      throw new Error(`AI21 API error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    // Adjust based on expected response structure (based on SDK examples)
    const assistantMessage = data.result?.output || data.output || 'No response content'; // Fallback if structure is unknown

    // Save both user message and assistant response to database
    const { error: userMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });

    const { error: assistantMsgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

    if (userMsgError || assistantMsgError) {
      console.error('Error saving messages:', userMsgError || assistantMsgError);
      throw new Error('Failed to save messages to database');
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      model: model,
      isPremium: isPremium
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
