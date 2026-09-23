import { redirect } from 'next/navigation'

export default async function ServiceChargeRedirect({ params }) {
  const { slug } = await params
  redirect(`/developer/${slug}/chargeables/charges`)
}
