import { createClient } from '@supabase/supabase-js'

// Supabase's dashboard also shows the REST address (…/rest/v1/); the client
// wants just the project URL, so trim that suffix if it was pasted.
const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null when env vars are missing, so the shelf still runs locally with
// starter books only.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
