// initializing Supabase Client

const { createClient } = supabase;

const supaUrl = ''
const supaAnon = ''

const supaClient = createClient(supaUrl, supaAnon)

// Html Elements

const loginButton = document.querySelector("#signInBtn")

// Event Listeners

loginButton.addEventListener("click", () => {
    supaClient.auth.signInWithOAuth({
        provider: 'google',
    });
})