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
    const { messages, sessionType, context } = await req.json();

    let systemMessage = sessionType === 'sos'
      ? SYSTEM_PROMPT + '\n\nThis is an SOS session. The user is reaching out in a moment of crisis. Be especially warm and present.'
      : SYSTEM_PROMPT;

    // Personal context the app sends (first names and the user's own stats,
    // shared with their consent via the app). Weave it in naturally — never
    // recite it back as a list.
    if (context && typeof context === 'object') {
      const lines: string[] = [];
      if (context.username) lines.push(`They go by ${context.username}.`);
      if (context.partnerName) lines.push(`Partner: ${context.partnerName}.`);
      if (context.childrenNames) lines.push(`Children: ${context.childrenNames}.`);
      if (context.petName) lines.push(`Pet: ${context.petName}.`);
      if (typeof context.urgesBeaten === 'number' && context.urgesBeaten > 0)
        lines.push(`They have beaten ${context.urgesBeaten} urges using the app.`);
      if (typeof context.afDaysThisMonth === 'number' && context.afDaysThisMonth > 0)
        lines.push(`${context.afDaysThisMonth} alcohol-free days marked this month.`);
      if (context.sessionActive)
        lines.push('They are CURRENTLY in a drinking session — meet them there without judgement.');
      if (context.livesIsolated)
        lines.push('They live somewhere rural/isolated; in-person support is hard to reach.');
      if (lines.length > 0) {
        systemMessage +=
          '\n\nWhat you quietly know about this person (use it naturally when relevant, never recite it):\n- ' +
          lines.join('\n- ');
      }
    }

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
