import { cookies } from 'next/headers'
import { ExchangeRates, isSupportedCurrency } from '@shopvibe/shared'
import HomePageClient from '../components/HomePageClient'
import { CURRENCY_COOKIE } from '../contexts/currencyCookie'
import { ApiProductListResponse, mapApiProduct } from '../services/productTransforms'
import { Product } from '../types/product'

export const dynamic = 'force-dynamic'

const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

async function getInitialProducts(): Promise<Product[]> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/products?page=1&limit=12&sortBy=createdAt&sortOrder=desc`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as ApiProductListResponse
    return data.data.map(mapApiProduct)
  } catch {
    return []
  }
}

async function getInitialRates(): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/currency/rates`, { cache: 'no-store' })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { rates: ExchangeRates }
    return data.rates
  } catch {
    return null
  }
}

export default async function Home() {
  // Render prices in the visitor's saved currency from the first paint
  const savedCurrency = cookies().get(CURRENCY_COOKIE)?.value
  const [initialProducts, initialRates] = await Promise.all([getInitialProducts(), getInitialRates()])

  return (
    <HomePageClient
      initialProducts={initialProducts}
      initialCurrency={isSupportedCurrency(savedCurrency) ? savedCurrency : null}
      initialRates={initialRates}
    />
  )
}
