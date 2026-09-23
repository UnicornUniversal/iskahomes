import { redirect } from 'next/navigation'

export default async function AgencyChargesRedirect({ params }) {
  const { slug } = await params
  redirect(`/agency/${slug}/chargeables/charges`)
}
