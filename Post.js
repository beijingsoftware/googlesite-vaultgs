var PRIVATE_KEY = `********************`

function doPost(e) {
    var contents
    try {
        contents = VaultGS.getPostContents(e.postData)
    } catch (error) {
        return outputJSON({ error: `Could not parse request body:${error}` })
    }

    if (isValidPrivateKey(contents.PRIVATE_KEY)) {
        return handlePrivateRequest(contents)
    }

    return handlePublicRequest(contents)
}

function isValidPrivateKey(key) {
    return key && key === PRIVATE_KEY
}

function outputJSON(data) {
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
        ContentService.MimeType.JSON
    )
}

function getCurrentDayAbbreviation() {
    const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
    const today = new Date()
    const currentDay = today.getDay()
    const currentDayAbbreviation = daysOfWeek[currentDay]
    return currentDayAbbreviation
}

function handlePublicRequest(contents) {
    try {
        if (!contents.apiKey) {
            throw new Error("No api key included with request")
        }

        const userData = getUserDataFromApiKey(contents.apiKey)

        if (userData) {
            var apiCalls = userData.apiCalls || {}
            const currentDayAbbreviation = getCurrentDayAbbreviation()

            if (apiCalls[currentDayAbbreviation] !== undefined) {
                apiCalls[currentDayAbbreviation]++
            } else {
                apiCalls[currentDayAbbreviation] = 1
            }

            VaultGS.evaluate({
                key: DB_KEY,
                action: "update",
                type: "entry",
                table: "UserData",
                id: userData.id,
                entry: { apiCalls: apiCalls },
            })
        }

        const result = VaultGS.evaluate(contents)
        return outputJSON(result)
    } catch (error) {
        return outputJSON({ error: error.message })
    }
}

function handlePrivateRequest(contents) {
    return outputJSON("private")
}
