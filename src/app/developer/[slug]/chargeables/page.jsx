import { redirect } from 'next/navigation'

export default async function DeveloperChargeablesIndex({ params }) {
  const { slug } = await params
  redirect(`/developer/${slug}/chargeables/types`)
}
