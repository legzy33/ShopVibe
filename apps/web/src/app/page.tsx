import HomePageClient from '../components/HomePageClient'
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

export default async function Home() {
  const initialProducts = await getInitialProducts()

  return <HomePageClient initialProducts={initialProducts} />
}
