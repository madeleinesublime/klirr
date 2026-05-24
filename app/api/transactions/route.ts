import { addTransaction, getBalance, verifyPin } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const { pin, amount, description, type } = body as {
    pin: string
    amount: number
    description: string
    type: string
  }

  if (!verifyPin(pin)) {
    return Response.json({ error: 'Fel PIN-kod' }, { status: 401 })
  }

  if (typeof amount !== 'number' || amount === 0) {
    return Response.json({ error: 'Ogiltigt belopp' }, { status: 400 })
  }

  const tx = addTransaction(amount, description || (amount > 0 ? 'Insättning' : 'Köp'), type || 'manual')
  const balance = getBalance()

  return Response.json({ transaction: tx, balance })
}
