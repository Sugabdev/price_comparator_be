import { scraper, updateSearch } from '../services/scrapers.js'

export async function scraperData (req, res) {
  try {
    const data = await scraper()

    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getSearch (req, res) {
  try {
    const searchRequest = await req.body

    updateSearch(searchRequest.search)

    return res.status(200).json({ message: 'status founded' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
