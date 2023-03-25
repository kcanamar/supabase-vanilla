// initializing Supabase Client

const { createClient } = supabase;


const supaClient = createClient(supaUrl, supaAnon)

// Html Elements

const loginButton = document.querySelector("#signInBtn")
const logoutButton = document.querySelector("#signOutBtn")
const whenSignedOut= document.querySelector("#whenSignedOut")
const whenSignedIn = document.querySelector("#whenSignedIn")
const userDetails = document.querySelector("#userDetails")
const allThingsSection = document.querySelector("#allThings")
const allThingsList = document.querySelector("#allThingsList")
const myThingsSection = document.querySelector("#theThings")
const myThingsList = document.querySelector("#thingsList")
const createThing = document.querySelector("#createThing")

// Event Listeners

loginButton.addEventListener("click", () => {
    supaClient.auth.signInWithOAuth({
        provider: 'google',
    });
})

logoutButton.addEventListener("click", () => {
    supaClient.auth.signOut()
})

// Init

checkUserOnStartUp()

supaClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
        adjustForUser(session.user)
    } else {
        adjustForNoUser()
    }
})

// function declarations

async function checkUserOnStartUp() {
    const {
        data: { user },
    } = await supaClient.auth.getUser();
    if (user) {
        adjustForUser(user)
    } else {
        adjustForNoUser()
    }
}

function adjustForUser(user) {
    whenSignedIn.hidden = false;
    whenSignedOut.hidden = true;
    myThingsSection.hidden = false;
    userDetails.innerHTML = `
    <h3> Hello ${user.user_metadata.full_name}</h3>
    <img src="${user.user_metadata.avatar_url}" />
    <p>UID: ${user.id}</p>
    `
}

function adjustForNoUser() {
    whenSignedIn.hidden = true;
    whenSignedOut.hidden = false;
    myThingsSection.hidden = true;
}