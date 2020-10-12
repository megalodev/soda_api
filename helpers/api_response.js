/**
 * Method ini digunakan untuk membuat api response (sigle data)
 * @param {string} res 
 * @param {string} status 
 * @param {string} msg 
 * @param {string} result 
 * @param {string} code 
 */
export function apiResp(res, status, msg, result, code) {
    const results = {
        status: status,
        message: msg,
        result: result
    }

    return res.status(code).send(results)
}

/**
 * Method ini digunakan jika hasil dari result memiliki banyak data object (entries)
 * @param {string} res 
 * @param {string} status 
 * @param {string} msg 
 * @param {string} entries 
 * @param {string} code 
 */
export function apiRespEntries(res, status, msg, entries, code) {
    const results = {
        status: status,
        message: msg,
        result: [
            {
                entries: entries
            }
        ]
    }

    return res.status(code).send(results)
}