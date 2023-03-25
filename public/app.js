// initializing Supabase Client

const { createClient } = supabase;

const supaUrl = ''
const supaAnon = ''

const supaClient = createClient(supaUrl, supaAnon)