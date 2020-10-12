import bcrypt from 'bcrypt'
import crypto from 'crypto'

const salt = bcrypt.genSaltSync(15)
const secret = crypto.randomBytes(64)
const bins = crypto.randomBytes(64)
const date = new Date()

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
 * Digunakan untuk men-generasi token dengan menggunakan algoritma SHA-512
 */
export function genToken() {
    const hash = crypto.createHmac('sha512', secret).update(bins).digest('hex')

    return hash
}

/**
 * Method untuk keperluan kadaluarsa token (7 hari)
 */
export function expireDate() {
    date.setDate(date.getDate() + 7)
}