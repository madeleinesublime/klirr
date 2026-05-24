import {
  checkAndDoTopup,
  getBalance,
  getSettings,
  getTransactions,
} from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  checkAndDoTopup()

  const settings = getSettings()
  const balance = getBalance()
  const transactions = getTransactions(30)

  return Response.json({
    balance,
    transactions,
    settings: {
      child_name: settings.child_name,
      weekly_amount: settings.weekly_amount,
      topup_day: settings.topup_day,
      last_topup_date: settings.last_topup_date,
      has_pin: settings.parent_pin_hash !== '',
    },
  })
}
