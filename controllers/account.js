import { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, OK, UNAUTHORIZED } from 'http-status'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import ApiResponse from '../helpers/api_response'
import Crypto from '../services/crypto'
import Validator from '../helpers/validator'
const Account = require('../models/account/account')
const AccountRegister = require('../models/account/account_register')
const AccessToken = require('../models/account/access_token')
const mailer = require('../services/mailer')

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
		const text = uuidv4()
		const token = Crypto.encrypt(text)
		// Membuat nomor acak sebanyak 6 dijit angka
		const code = Math.floor(100000 + Math.random() * 900000)

		const accountRegister = new AccountRegister({
			full_name: full_name,
			email: email,
			phone_num: phone_num,
			password: passHash,
			token: token,
			code: code
		})

		await accountRegister.save(function (err, result) {
			// Handle duplicate key
			if (err && err.code === 11000) {
				return ApiResponse.result(res, 'Failed', 'Account already exists', null, BAD_REQUEST)
			} else {
				// Kirim kode aktivasi ke email
				mailer.mailer(result.email, 'Kode Aktivasi Akun Anda',
					`<p>Kode aktivasi akun anda adalah <b>${result.code}</b>.<br>
			Jangan berikan kode aktivasi kepada siapa pun termasuk dari pihak SMARAK</p>`)

				return ApiResponse.result(res, 'Success', '', { email: result.email, token: result.token, register_time: result.register_time }, CREATED)
			}
		})
	} catch (error) {
		console.error(error.message);
		return ApiResponse.result(res, 'Failed', 'Internal server error', error.message, INTERNAL_SERVER_ERROR)
	}
}

export async function activate(req, res) {
	try {
		// Validasi untuk activasi
		const { error } = Validator.activate(req.body)

		if (error) {
			const msgErr = error.details[0].message

			return ApiResponse.result(res, 'Failed', msgErr, null, BAD_REQUEST)
		}

		const { token, code } = req.body
		AccountRegister.findOne({ token: token, code: code }, function (err, result) {
			if (err) {
				console.error(err);
			} else if (!result) {
				return ApiResponse.result(res, 'Failed', 'Not valid', null, BAD_REQUEST)
			} else {
				const account = new Account({
					full_name: result.full_name,
					email: result.email,
					phone_num: result.phone_num,
					password: result.password,
					active: true
				})

				account.save(function (err) {
					if (err && err.code === 11000) {
						return ApiResponse.result(res, 'Failed', 'Account already exists', null, BAD_REQUEST)
					} else {
						return ApiResponse.result(res, 'Success', 'Account activated', null, OK)
					}
				})

				// Hapus collection setelah user berhasil aktivasi
				AccountRegister.findOneAndDelete({ token: token }, function (err) {
					if (err) {
						console.error(err);
					}
				})
			}
		})
	} catch (error) {
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
			} else if (!account) {
				return ApiResponse.result(res, 'Failed', 'Email not found', null, BAD_REQUEST)
			} else if (!account.active) {
				return ApiResponse.result(res, 'Failed', 'Account not yet active', null, UNAUTHORIZED)
			}

			const match = Crypto.passMatch(password, account.password)

			if (!match) {
				return ApiResponse.result(res, 'Failed', 'Invalid password', null, BAD_REQUEST)
			}

			// Cek terlebih dahulu apakah account_id ada di collection AccessToken
			// jika tidak ada buatkan token
			// jika ada update token lama ke token yang baru
			const { PRIVATE_KEY } = process.env
			AccessToken.findOne({ account_id: account.id }, function (err, accessToken) {
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

					return ApiResponse.result(res, 'Success', 'Token created',
						{ account_id: accessToken.account_id, token: accessToken.token, expires: accessToken.expires }, CREATED)
				} else {
					AccessToken.findOneAndUpdate({ account_id: account.id }, { token: token, expires: expires }, { new: true }, function (err, newToken) {
						if (err) {
							console.error(err)
						} else {
							return ApiResponse.result(res, 'Success', 'Token created',
								{ account_id: newToken.account_id, token: newToken.token, expires: newToken.expires }, CREATED)
						}
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
	try {
		Account.findById(req.token_id, { password: 0 }, function (err, account) {
			if (err) {
				console.error(err);
			} else if (!account) {
				return ApiResponse.result(res, 'Failed', 'Account not found', null, BAD_REQUEST)
			} else if (!account.active) {
				return ApiResponse.result(res, 'Failed', 'Account not yet active', null, BAD_REQUEST)
			} else {
				return ApiResponse.result(res, 'Success', '', account, OK)
			}
		})
	} catch (error) {
		console.error(error.message);
		return ApiResponse.result(res, 'Failed', 'Internal server error', error.message, INTERNAL_SERVER_ERROR)
	}
}

export async function update(req, res) {
	try {
		await Account.findByIdAndUpdate(req.query.id, req.body, function (err, result) {
			if (err) {
				console.error(err);
			}

			const { error } = Validator.update(req.body)

			if (error) {
				const msgErr = error.details[0].message

				return ApiResponse.result(res, 'Failed', msgErr, null, BAD_REQUEST)
			} else if (!result) {
				return ApiResponse.result(res, 'Failed', 'Not valid', null, BAD_REQUEST)
			} else if (!result.active) {
				return ApiResponse.result(res, 'Failed', 'Account not yet active', null, UNAUTHORIZED)
			} else {
				return ApiResponse.result(res, 'Success', '', result, OK)
			}
		})
	} catch (error) {
		console.error(error.message);
		return ApiResponse.result(res, 'Failed', 'Internal server error', error.message, INTERNAL_SERVER_ERROR)
	}
}

export async function unauthorize(req, res) {
	// Menghapus token dari collection. Mungkin token sebelumnya yang sudah dihapus
	// akan tetap valid, itu dikarenakan jwt menganggap token tersebut masih belum
	// expired atau kadaluarsa. Waktu expired 1 jam.
	await AccessToken.findOneAndDelete({ account_id: req.token_id }, function (err) {
		if (err) {
			console.error(err);
		} else {
			return ApiResponse.result(res, 'Success', 'Unauthorized', null, UNAUTHORIZED)
		}
	})
}