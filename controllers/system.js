import { OK } from 'http-status'
import ApiResponse from '../helpers/api_response'
const { gitCommitHash } = require('../helpers/git_rev')
const pkg = require('../package.json')

export async function gitInfo(req, res) {
    const info = { app: pkg.name, version: pkg.version, git: gitCommitHash() }

    return ApiResponse.result(res, 'Success', '', info, OK)
}