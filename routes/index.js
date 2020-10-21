import { Router } from 'express'
const system = require('../controllers/system')
const account = require('../controllers/account')
const router = Router()

// System
router.route('/system').get(system.gitInfo)

// Account auth
router.route('/account/auth/register').post(account.register)

export default router