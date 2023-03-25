// initializing Supabase Client

const { createClient } = supabase;

const supaUrl = ''
const supaAnon = ''

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
const signUpWUN = document.getElementById("signUpWithUsername");
const signInWUN = document.getElementById("signInWithUsername");
const signUpFieldSet = document.getElementById("signUpFieldSet");
const signInFieldSet = document.getElementById("signInFieldSet");
const signUpForm = document.getElementById("signUpForm");
const signInForm = document.getElementById("signInForm");
const signInUN = document.getElementById("signInUsername");
const signInPW = document.getElementById("signInPassword");
const signUpUN = document.getElementById("signUpUsername");
const signUpPW = document.getElementById("signUpPassword");

// Event Listeners

signInWUN.addEventListener("click", async () => {
    signInFieldSet.hidden = false;
    signUpFieldSet.hidden = true;
})

signUpWUN.addEventListener("click", async () => {
    signUpFieldSet.hidden = false;
    signInFieldSet.hidden = true;
})

signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userName = signUpUN.value
    const password = signUpPW.value
    await signUp(userName, password)
})

signInForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    const userName = signInUN.value
    const password = signInPW.value
    await signIn(userName, password)
})

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
let userThingsSubscription;
const userThings = {}
const allThings = {}
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

async function adjustForUser(user) {
    whenSignedIn.hidden = false;
    whenSignedOut.hidden = true;
    myThingsSection.hidden = false;
    userDetails.innerHTML = `
    <h3> Hello ${user.user_metadata.full_name || "User"}</h3>
    <img src="${user.user_metadata.avatar_url}" />
    <p>UID: ${user.id}</p>
    `
    await getUsersInitialThings(user)
    listenToUserThingsChanges(user)
}

function adjustForNoUser() {
    whenSignedIn.hidden = true;
    whenSignedOut.hidden = false;
    myThingsSection.hidden = true;
    if (userThingsSubscription) {
        userThingsSubscription.unsubscribe()
        userThingsSubscription = null;
    }
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

async function getUsersInitialThings(user) {
    const { data } = await supaClient
        .from("things")
        .select("*")
        .eq("owner", user.id)
    for (const thing of data) {
        userThings[thing.id] = thing;
    }
    renderUserThings()
}

function handleUserThingsUpdate(update) {
    if (update.eventType === "DELETE") {
        delete userThings[update.old.id]
    } else {
        userThings[update.new.id] = update.new
    }
    renderUserThings()
}

async function listenToUserThingsChanges(user) {
    if (userThingsSubscription) {
        return
    }

    userThingsSubscription = supaClient
        .channel(`public:things:owner=eq.${user.id}`)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "things",
                filter: `owner=eq.${user.id}`
            },
            handleUserThingsUpdate
        )
        .subscribe()

}

function renderUserThings() {
    const tableHeader = `
    <thead>
        <tr>
            <th>Name</th>
            <th>Weight</th>
            <th></th>
        </tr>
    </thead>
    `
    const tableBody = Object.values(userThings)
        .sort((a, b) => (a.weight > b.weight ? -1 : 1))
        .map((thing) => {
            return `
                <tr>
                    <td>${thing.name}</td>
                    <td>${thing.weight} lbs.</td>
                    <td>${deleteButtonTemplate(thing)}</td>
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

    myThingsList.innerHTML = table
}

function deleteButtonTemplate(thing) {
    return `
    <button
        onClick="deleteAtId(${thing.id})"
        class="btn btn-outline-danger"
    >
        ${trashIcon}
    </button>
    `
}

async function deleteAtId(id) {
    await supaClient.from("things").delete().eq("id", id)
}

const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"/></svg>`

function randomString(length) {
    const chars = "0123456789abcdefghijklmnopqrstuvxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let result = ""
    for ( let i = length; i > 0; --i ) {
        result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
}

async function signUp(username, password) {
    const email = `foo-${randomString(5)}@bar.com`
    const { data, error } = await supaClient.auth.signUp({
        email,
        password,
    })
    if (error) {
        console.log(error)
        return
    }
    console.log("debug:",{data, error})
    await supaClient
        .from("username")
        .insert([{ username, userid: data.user.id }])
}

async function signIn(username, password) {
    const response = await supaClient.functions.invoke("get-fake-email", {
        body: { username },
    })
    const { data, error } = await supaClient.auth.signInWithPassword({
        email: response.data.email,
        password,
    })
    console.log("debug:", {response, data})
}