import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const SYSTEM_PROMPT = `You are a compassionate recovery support companion for Alchono,
an app that helps people understand their relationship with alcohol.

Your role:
- Use motivational interviewing techniques — reflect, explore, affirm
- NEVER shame, judge, preach, or lecture
- Be warm, calm, and human
- Ask one open question at a time
- Acknowledge feelings before offering suggestions
- If someone is in immediate danger, gently suggest emergency services
- Keep responses short (2-4 sentences) unless the user needs more

You are NOT a replacement for professional support. If someone describes a medical emergency,
direct them to call emergency services immediately.

Remember: change happens through connection, not correction.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, sessionType } = await req.json();

    const systemMessage = sessionType === 'sos'
      ? SYSTEM_PROMPT + '\n\nThis is an SOS session. The user is reaching out in a moment of crisis. Be especially warm and present.'
      : SYSTEM_PROMPT;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.slice(-20),
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message ?? 'OpenAI error');
    }

    const reply = data.choices[0]?.message?.content ?? "I'm here for you.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error), reply: "I'm having trouble connecting right now. I'm still here for you." }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
