import { chromium } from 'playwright'

// FORMAT THE PRICE INTO NUMERIC FORMAT
function normalizePrice (price) {
  if (!price) return null

  // Eliminar cualquier carácter que no sea número, punto o coma
  let clean = price.replace(/[^\d.,]/g, '')

  // Caso 1: formato latino 1.234,56 → eliminar puntos de miles y cambiar coma por punto
  if (clean.includes(',') && clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else if (clean.includes('.')) {
    // Caso 2: formato anglo 1,234.56 → eliminar comas de miles
    clean = clean.replace(/,/g, '')
  }

  return parseFloat(clean)
}

// FORMAT SEARCH PARAMS
const searchParams = (search) => {
  const words = search.split(' ')

  const formatedSearch = words.join('+')
  return formatedSearch
}

let search

// UDPATE SEARCH
export function updateSearch (data) {
  search = data
}

export async function scraper () {
  if (!search) throw new Error('Not search founded')

  try {
    const stores = [
      {
        name: 'Amazon',
        url: `https://www.amazon.com/s?k=${searchParams(search)}`,
        data: async ({ browser, url }) => {
        // BROWSER SETTINGS
          const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            viewport: { width: 1366, height: 768 },
            locale: 'en-US'
          })

          // PAGE SETTINGS
          const page = await context.newPage()

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 60000 })

          // GET PRODUCTS
          const productList = await page.$$('[data-component-type="s-search-result"]')

          if (!productList) {
            await page.close()
            throw new Error('No se encontró ningún producto')
          }

          for (const product of productList) {
            if (!product) continue

            // GET PRODUCT IMAGE
            const image = await product.$eval('img.s-image', (element) => element.getAttribute('src'))

            // GET PRODUCT DESCRIPTION
            const descriptionDiv = await product.$('div[data-cy=title-recipe]')
            const description = await descriptionDiv?.$eval('span', (element) => element.innerText)

            if (description === 'Sponsored') continue

            // GET PRODUCT PRICE
            const priceContainer = await product.$('span[class="a-price"]')
            const price = await priceContainer?.$eval('span', (element) => element.innerText)

            // RETURN THE PRICE IN NUMERIC FORMAT
            const orderByPrice = normalizePrice(price)

            // GET PROUDUCT LINK
            const rawLink = await product.$eval('a.a-link-normal', (element) => element.getAttribute('href'))

            const link = `https://www.amazon.com${rawLink}`

            if (!image || !description || !price || !link || !url || !orderByPrice) continue

            await page.close()

            // RETURN PRODUCT DATA
            return { image, description, price, link, url, orderByPrice }
          }

          throw new Error('AMAZON: No se pudo obtener el producto')
        }
      },
      {
        name: 'Mercado Libre',
        url: `https://listado.mercadolibre.com.ve/${searchParams(search)}`,
        data: async ({ browser, url }) => {
        // BROWSER SETTINGS
          const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          })

          // PAGE SETTINGS
          const page = await context.newPage()

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })

          await page.waitForSelector('.ui-search-layout__item', { timeout: 60000 })

          // GET PRODUCTS
          const productList = await page.$$('.ui-search-layout__item')

          if (!productList) {
            await page.close()
            throw new Error('No se encontró ningún producto')
          }

          for (const product of productList) {
            if (!product) continue

            // GET PRODUCT IMAGE
            const image = await product.$eval('img', el => el.getAttribute('src'))

            // GET PRODUCT DESCRIPTION
            const description = await product.$eval('a.poly-component__title', el => el.textContent?.trim() || '')

            // GET PRODUCT PRICE
            const priceContainer = (await product.$$('div.poly-price__current')) ?? ('aria-roledescription="Monto"')

            let price = ''
            for (const element of priceContainer) {
              price += (await element.textContent()) ?? ''
            }
            price = price.replace(/%|OFF/g, '')

            // RETURN THE PRICE IN NUMERIC FORMAT
            const orderByPrice = normalizePrice(price)

            // GET PRODUCT LINK
            const link = await product.$eval('a.poly-component__title', (element) => element.getAttribute('href'))

            if (!image || !description || !price || !link || !url || !orderByPrice) continue

            await page.close()

            // RETURN PRODUCT DATA
            return { image, description, price, link, url, orderByPrice }
          }

          throw new Error('MERCADO LIBRE: No se pudo obtener el producto')
        }
      },
      {
        name: 'Newegg',
        url: `https://www.newegg.com/p/pl?d=${searchParams(search)}`,
        data: async ({ browser, url }) => {
        // BROWSER SETTINGS
          const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            viewport: { width: 1366, height: 768 },
            locale: 'en-US'
          })

          // PAGE SETTINGS
          const page = await context.newPage()

          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await page.waitForSelector('div.item-cell', { timeout: 60000 })

          // GET PRODUCTS
          const productList = await page.$$('div.item-cell')

          if (!productList) {
            await page.close()
            throw new Error('No se encontró ningún producto')
          }

          for (const product of productList) {
            if (!product) continue

            // GET PRODUCT IMAGE
            const image = await product.$eval('img', (element) => element.getAttribute('src'))

            // GET PRODUCT DESCRIPTION
            const description = await product.$eval('a.item-title', (element) => element.textContent?.trim())

            // GET PRODUCT PRICE
            const wholePrice = await product.$eval('li.price-current > strong', element => element.textContent?.trim())
            const decimalPrice = await product.$eval('li.price-current > sup', element => element.textContent?.trim())
            const price = `$${wholePrice}${decimalPrice}`

            // RETURN THE PRICE IN NUMERIC FORMAT
            const orderByPrice = normalizePrice(price)

            // GET PRODUCT LINK
            const link = await product.$eval('a.item-img', (element) => element.getAttribute('href'))

            if (!image || !description || !price || !link || !url || !orderByPrice) continue

            await page.close()

            // RETURN PRODUCT DATA
            return { image, description, price, link, url, orderByPrice }
          }

          throw new Error('NEWEGG: No se pudo obtener el producto')
        }
      }
    ]

    const browser = await chromium.launch({
      headless: true,
      slowMo: 200
    })

    // SCRAPE EACH STORE
    const storesInfo = []

    for (const store of stores) {
    // DESTRUCTURE EACH STORE
      const { name, url, data } = store

      try {
      // GET STORE DATA
        const { image, description, price, link, orderByPrice } = await data({ browser, url })

        storesInfo.push({ name, image, description, price, link, url, orderByPrice })
      } catch (error) {
        console.error(error, `Error al intentar obtener datos de ${name}`)
        continue
      }
    }

    await browser.close()

    return storesInfo
  } catch (error) {
    console.error(error)
    throw new Error('Internal server error')
  }
}
