import bcrypt from 'bcrypt'
import crypto from 'crypto'
import randomBinary from 'random-binary'

const salt = bcrypt.genSaltSync(15)
const secret = crypto.randomBytes(32)
const bins = randomBinary(32)

/**
 * Digunakan untuk hash password
 * @param {string} password 
 */
export function passHash(password) {
    const genHash = bcrypt.hashSync(password, salt)

    return genHash
}

/**
 * Digunakan untuk verifikasi password, apakah password
 * yang dimasukkan sama dengan hash yang dihasilkan dari
 * method `passHash()`
 * @param {string} password 
 * @param {string} hash 
 */
export function passVerify(password, hash) {
    const verify = bcrypt.compareSync(password, hash)

    return verify
}

/**
 * Digunakan untuk men-generasi token dengan menggunakan algoritma SHA256
 */
export function genToken() {
    const hash = crypto.createHmac('sha256', secret).update(bins).digest('hex')

    return hash
}