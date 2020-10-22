import bcrypt from 'bcrypt'
import crypto from 'crypto'
import ms from 'ms'
import { v4 as uuidv4 } from 'uuid'

const salt = bcrypt.genSaltSync(15)
const key = crypto.randomBytes(256 / 8).toString('hex')
const text = uuidv4()
const bytes = crypto.randomBytes(16)

class Crypto {

    /**
     * Digunakan untuk hash password
     * @param {string} password 
     */
    static passHash(password) {
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
    static passMatch(password, hash) {
        const verify = bcrypt.compareSync(password, hash)

        return verify
    }

    /**
     * Digunakan untuk men-generasi token dengan menggunakan algoritma AES-256-CBC
     */
    static token() {
        const chiper = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), bytes)
        let encrypted = chiper.update(text)
        encrypted = Buffer.concat([encrypted, chiper.final()])

        return encrypted.toString('hex')
    }

    /**
     * Expired time
     */
    static expires() {
        return Math.floor(Date.now() + ms('1h'))
    }
}

export default Crypto;