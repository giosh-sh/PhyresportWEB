import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'
import { getCurrencyConfig } from '@/lib/admin/currency'
import { getAdminTheme } from '@/lib/admin/theme'
import { isAdmin } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn()
  }

  if (!(await isAdmin(userId))) {
    redirect('/')
  }

  const [currencyConfig, theme] = await Promise.all([getCurrencyConfig(), getAdminTheme()])

  return (
    <AdminLayoutClient currencyConfig={currencyConfig} theme={theme}>
      {children}
    </AdminLayoutClient>
  )
}
