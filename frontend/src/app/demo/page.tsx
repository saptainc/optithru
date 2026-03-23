import { redirect } from 'next/navigation'

export default function PublicDemoPage() {
  redirect('/dashboard?demo=true')
}
