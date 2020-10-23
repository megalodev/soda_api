import { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from 'http-status'
import jwt from 'jsonwebtoken'
import ApiResponse from '../helpers/api_response'
import Crypto from '../services/crypto'
import Validator from '../helpers/validator'
const Account = require('../models/account/account')
const AccessToken = require('../models/account/access_token')

export async function register(req, res) {
    try {
        // Validasi untuk register
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

        return ApiResponse.result(res, 'Success', '', save, CREATED)
    } catch (error) {
        // Belum menemukan cara terbaik untuk handle duplicate key/data
        // yang sudah terdaftar
        if (error && error.code === 11000) {
            return ApiResponse.result(res, 'Failed', 'Account already exists', null, BAD_REQUEST)
        }

        console.error(error.message);
        return ApiResponse.result(res, 'Failed', 'Internal server error', error.message, INTERNAL_SERVER_ERROR)
    }
}

export async function authorize(req, res) {
    try {
        // Validasi untuk authorize
        const { error } = Validator.authorize(req.body)

        if (error) {
            const msgErr = error.details[0].message

            return ApiResponse.result(res, 'Failed', msgErr, null, BAD_REQUEST)
        }

        // Cek apakah email ada di collection
        const { email, password } = req.body
        Account.findOne({ email: email }, function (err, account) {
            if (err) {
                console.error(err);
            }

            if (!account) {
                return ApiResponse.result(res, 'Failed', 'Email not found', null, BAD_REQUEST)
            }

            const match = Crypto.passMatch(password, account.password)

            if (!match) {
                return ApiResponse.result(res, 'Failed', 'Invalid password', null, BAD_REQUEST)
            }

            // Cek terlebih dahulu apakah account_id ada di collection AccessToken
            // jika tidak ada buatkan token
            // jika ada update token lama ke token yang baru
            const { PRIVATE_KEY } = process.env
            AccessToken.findOne({ account_id: account.id }).exec(function (err, accessToken) {
                if (err) {
                    console.error(err);
                }

                // Membuat token baru dengan waktu kadaluarsa 1 jam
                const token = jwt.sign({ id: account.id }, PRIVATE_KEY, { expiresIn: '1h' })
                const expires = Crypto.expires()
                if (!accessToken) {
                    const accessToken = new AccessToken({
                        account_id: account.id,
                        token: token,
                        expires: expires
                    })

                    accessToken.save()

                    return ApiResponse.result(res, 'Success', 'Token created', accessToken, CREATED)
                } else {
                    AccessToken.findOneAndUpdate({ account_id: account.id }, { token: token, expires: expires }, { new: true }, function (err, newToken) {
                        if (err) {
                            console.error(err)
                        }

                        return ApiResponse.result(res, 'Success', 'Token created', newToken, CREATED)
                    })
                }
            })
        })
    } catch (error) {
        console.error(error.message);
        return ApiResponse.result(res, 'Failed', 'Internal server error', error.message, INTERNAL_SERVER_ERROR)
    }
}

export async function me(req, res) {
    // Mencari akun berdasarkan token_id. token_id ini didapat di dalam file services/verif_token.js
    // Fungsinya adalah untuk mencari account.id yang sudah di sign menggunakan fungsi jwt.sign() 
    // yang sudah diproses sebelumnya, lalu diverifikasi menggunakan jwt.verify() 
    // untuk mengembalikan nilai account.id seperti semula
    Account.findById(req.token_id, { password: 0 }, function (err, account) {
        if (err) {
            return ApiResponse.result(res, 'Failed', 'Internal server error', null, INTERNAL_SERVER_ERROR)
        }

        if (!account) {
            return ApiResponse.result(res, 'Failed', 'Account not found', null, BAD_REQUEST)
        }

        return ApiResponse.result(res, 'Success', '', account, OK)
    })
}

export async function unauthorize(req, res) {
    // Menghapus token dari collection. Mungkin token sebelumnya yang sudah dihapus
    // akan tetap valid, itu dikarenakan jwt menganggap token tersebut masih belum
    // expired atau kadaluarsa. Waktu expired 1 jam.
    await AccessToken.findOneAndDelete({ account_id: req.token_id }, function (err) {
        if (err) {
            console.error(err);
        }

        return ApiResponse.result(res, 'Success', 'Unauthorized', null, UNAUTHORIZED)
    })
}