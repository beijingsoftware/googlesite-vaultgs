const DB_KEY = "********************************************************"
const EXPIRATION_TIME = 5 // in minutes
const TIMEZONE = "America/Los_Angeles"


async function DataInit() {
    try {
        const actions = [
            {
                action: "create",
                type: "table",
                table: "UserData",
            },
            {
                action: "create",
                type: "column",
                table: "UserData",
                column: "keys",
                dataType: "JSON",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "UserData",
                column: "apiCalls",
                dataType: "JSON",
                required: true,
            },
            {
                action: "create",
                type: "column",
                table: "UserData",
                column: "apiKey",
                dataType: "string",
                required: true,
            },
        ]

        await Promise.all(
            actions.map(async (action) => {
                action.key = DB_KEY
                return VaultGS.evaluate(action)
            })
        )

        console.log("Database initialized successfully")
    } catch (error) {
        console.error("Error initializing database:", error)
    }
}

function generateKey(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let apiKey = ""
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        apiKey += characters.charAt(randomIndex)
    }
    return apiKey
}

async function createUserData(userId) {
    try {
        const key = generateKey(16)
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "create",
            type: "entry",
            table: "UserData",
            entry: {
                id: userId,
                keys: [],
                apiCalls: { sun: 0, mon: 0, tus: 0, wed: 0, thu: 0, fri: 0, sat: 0 },
                apiKey: key,
            },
        })
        return { message: "Successfully created user data" }
    } catch (error) {
        throw new Error(`Failed to create user data: ${error.message}`)
    }
}

async function deleteUserData(userId) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "delete",
            type: "entry",
            table: "UserData",
            id: userId,
        })
        return { message: "Successfully deleted user data" }
    } catch (error) {
        throw new Error(`Failed to delete user data: ${error.message}`)
    }
}

function getUserData(userId) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "entry",
            table: "UserData",
            id: userId,
        })
        return result.data
    } catch (error) {
        throw new Error(`Failed to fetch user data: ${error.message}`)
    }
}

function getUserDataFromApiKey(key) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "read",
            type: "column",
            table: "UserData",
            column: "apiKey",
        })

        const index = result.data.findIndex((e) => e === key) + 1

        if (index >= 1) {
            return getUserData(index)
        } else {
            throw new Error("invalid key")
        }
    } catch (error) {
        throw new Error(`Failed to fetch user data: ${error.message}`)
    }
}

async function getKeys(userId) {
    try {
        const userData = getUserData(userId)
        return userData.keys
    } catch (error) {
        throw new Error(`Failed to fetch keys: ${error.message}`)
    }
}

async function setKeys(userId, keys) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "update",
            type: "entry",
            table: "UserData",
            id: userId,
            entry: { keys: keys },
        })
        return { message: "Keys set successfully" }
    } catch (error) {
        throw new Error(`Failed to set keys: ${error.message}`)
    }
}

async function getApiCalls(userId) {
    try {
        const userData = getUserData(userId)
        return userData.keys
    } catch (error) {
        throw new Error(`Failed to fetch keys: ${error.message}`)
    }
}

async function setApiCalls(userId, apiCalls) {
    try {
        const result = VaultGS.evaluate({
            key: DB_KEY,
            action: "update",
            type: "entry",
            table: "UserData",
            id: userId,
            entry: { apiCalls: apiCalls },
        })
    } catch (error) {
        throw new Error(`Failed to set keys: ${error.message}`)
    }
}

function getDatabasesData(keys) {
    const data = {
        databases: [],
        connections: {
            successful: [],
            successfulCount: 0,
            failed: [],
            failedCount: 0,
        },
    }

    for (const key of keys) {
        const dbData = getDatabaseData(key) // Await the promise
        if (!dbData) {
            data.connections.failed.push(key) // Use push for arrays
            data.connections.failedCount++
        } else {
            data.databases.push(dbData) // Use push for arrays
            data.connections.successful.push(key) // Use push for arrays
            data.connections.successfulCount++
        }
    }

    return data
}

function getDatabaseData(key) {
    try {
        const result = VaultGS.evaluate({
            key: key,
            action: "read",
            type: "database",
        })
        return result
    } catch (error) {
        return null
    }
}

function createSessionData() {
    return {
        loggedIn: false,
        user: null,
        userData: null,
    }
}

async function login(user) {
    const sessionData = SessionManager.getSessionData()
    sessionData.loggedIn = true
    sessionData.user = user
    sessionData.userData = getUserData(user.id)
    SessionManager.setSessionData(sessionData)
}

function logout() {
    const sessionData = SessionManager.getSessionData()
    sessionData.loggedIn = false
    sessionData.user = null
    sessionData.userData = null
    SessionManager.setSessionData(sessionData)
}

async function reloadUser() {
    const data = SessionManager.getSessionData()
    if (data && data.user) {
        const user = await getUser(data.user.id)
        login(user)
    }
}

async function createUser(email, password, name) {
    await addUser(email, password, name)
    const userId = await getUserId(email)
    await createUserData(userId)
}

async function deleteUser(email) {
    const userId = await getUserId(email)
    await removeUser(email)
    deleteUserData(userId)
}
