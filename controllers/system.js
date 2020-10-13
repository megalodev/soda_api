import { OK } from 'http-status'

const { apiResp } = require('../helpers/api_response')
const { gitCommitHash } = require('../helpers/git_rev')
const pkgJson = require('../package.json')

export async function gitInfo(req, res) {
    const info = { app: pkgJson.name, version: pkgJson.version, git: gitCommitHash() }

    return apiResp(res, 'success', '', info, OK)
}