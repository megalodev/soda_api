import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from 'http-status'
import ApiResponse from '../helpers/api_response'
import Crypto from '../services/crypto'
import Validator from '../helpers/validator'
const Account = require('../models/account/account')

export async function register(req, res) {
    try {
        const { error } = Validator.register(req.body)

        if (error) {
            const msgErr = error.details[0].message

            return ApiResponse.result(res, 'Failed', msgErr, null, BAD_REQUEST)
        }

        const { full_name, email, phone_num, password } = req.body
        const passHash = Crypto.passHash(password)

        const acc = new Account({
            full_name: full_name,
            email: email,
            phone_num: phone_num,
            password: passHash
        })

        const save = await acc.save()

        return ApiResponse.result(res, 'Success', '', save, OK)
    } catch (error) {
        // Check duplicate key
        if (error && error.code === 11000) {
            return ApiResponse.result(res, 'Failed', 'Account already exists', null, BAD_REQUEST)
        }

        console.error(error.message);
        return ApiResponse.result(res, 'Failed', 'Internal server error', error.message, INTERNAL_SERVER_ERROR)
    }
}