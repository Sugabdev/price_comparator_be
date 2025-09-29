import { Router } from 'express'
import { scraperData, getSearch } from '../controllers/scraperController.js'

const router = Router()

router.get('/', scraperData)

router.post('/update', getSearch)

export default router
