import { addTransaction, getBalance } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const { amount, description } = body as { amount: number; description: string }

  if (typeof amount !== 'number' || amount <= 0) {
    return Response.json({ error: 'Ogiltigt belopp' }, { status: 400 })
  }

  const tx = addTransaction(-amount, description || 'Köp', 'debit')
  const balance = getBalance()

  return Response.json({ transaction: tx, balance })
}
