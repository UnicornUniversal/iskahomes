import { redirect } from 'next/navigation'

export default async function AgencyChargeablesIndex({ params }) {
  const { slug } = await params
  redirect(`/agency/${slug}/chargeables/types`)
}
