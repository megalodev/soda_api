import { Router } from 'express'
const system = require('../controllers/system')
const router = Router()

// System
router.route('/system').get(system.gitInfo)

export default router