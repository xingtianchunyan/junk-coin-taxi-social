// Issue a short-lived JWT embedding access_code, user_role, user_id, destination_id
// Usage: POST { access_code: "uuid" }
// Returns: { token: string, expires_in: number, user: { id, access_code, role, destination_id } }
// IMPORTANT: Configure the secret `SUPABASE_JWT_SECRET` in Function secrets with your project's JWT secret.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { create, getNumericDate, Header, Payload } from 'https://deno.land/x/djwt@v2.9/mod.ts';

const cors = (req: Request) => {
  const origin = req.headers.get('origin') ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors(req) });
  }

  try {
    const { access_code } = await req.json().catch(() => ({}));
    if (!access_code || typeof access_code !== 'string') {
      return new Response(JSON.stringify({ error: 'access_code (uuid) is required' }), { status: 400, headers: { 'content-type': 'application/json', ...cors(req) } });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) {
      return new Response(JSON.stringify({ error: 'Missing function secrets. Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET.' }), { status: 500, headers: { 'content-type': 'application/json', ...cors(req) } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get or create user by access_code (server-side, bypassing RLS via service role)
    const { data: user, error } = await admin
      .rpc('get_or_create_user_by_access_code', { input_access_code: access_code });

    if (error) {
      console.error('RPC get_or_create_user_by_access_code error', error);
      return new Response(JSON.stringify({ error: 'Failed to get or create user' }), { status: 500, headers: { 'content-type': 'application/json', ...cors(req) } });
    }

    const u = Array.isArray(user) ? user[0] : user; // rpc returns a row

    // Build JWT claims compatible with PostgREST/RLS
    const header: Header = { alg: 'HS256', typ: 'JWT' };
    const payload: Payload = {
      role: 'authenticated', // required by PostgREST to map to db role
      access_code: u.access_code,
      user_role: u.role ?? null,
      user_id: u.id,
      destination_id: u.destination_id ?? null,
      iss: 'edge-function:issue-access-token',
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60 * 24), // 24h
      sub: String(u.id),
      aud: 'authenticated',
    };

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const token = await create(header, payload, key);

    return new Response(JSON.stringify({ token, expires_in: 60 * 60 * 24, user: u }), {
      headers: { 'content-type': 'application/json', ...cors(req) },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), { status: 500, headers: { 'content-type': 'application/json', ...cors(req) } });
  }
});
