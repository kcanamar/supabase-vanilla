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

createThing.addEventListener("click", async () => {
    const {
        data: { user },
    } = await supaClient.auth.getUser();
    const thing = craeteRandomThing(user)
    await supaClient.from("things").insert([thing])

})
// Init

checkUserOnStartUp()

const myThings = {}
getAllInitalThings().then(() => listenToAllThings())

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

async function getAllInitalThings() {
    const { data } = await supaClient.from("things").select()
    for (const thing of data) {
        allThings[thing.id] = thing
    }
    renderAllThings()
}

function renderAllThings() {
    const tableHeader = `
    <thead>
        <tr>
            <th>Name</th>
            <th>Weight</th>
        </tr>
    </thead>
    `
    const tableBody = Object.values(allThings)
        .sort((a, b) => (a.weight > b.weight ? -1 : 1))
        .map((thing) => {
            return `
                <tr>
                    <td>${thing.name}</td>
                    <td>${thing.weight} lbs.</td>
                </tr>
            `
        })
        .join("")
    const table = `
        <table class="table table-striped">
            ${tableHeader}
            <tbody>
                ${tableBody}
            </tbody>
        </table>
    `

    allThingsList.innerHTML = table
}

function craeteRandomThing(user) {
    if (!user) {
        console.log("Must be signed in to create a thing")
        return
    }

    return {
        name: faker.commerce.productName(3),
        weight: Math.round(Math.random() * 100),
        owner: user.id,
    }
}

function handleAllThingsUpdate(update) {
    if (update.eventType === "DELETE") {
        delete allThings[update.old.id]
    } else {
        allThings[update.new.id] = update.new
    }
    renderAllThings()
}

function listenToAllThings() {
    supaClient.channel(`public:things`).on(
            "postgres_changes",
            { event: "*", schema: "public", table: "things" },
            handleAllThingsUpdate
        ).subscribe();
}