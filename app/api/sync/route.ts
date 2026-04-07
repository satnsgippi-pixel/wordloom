import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

const SYNC_KEY = 'wordloom:sync:data';

export async function GET() {
  try {
    const data = await kv.get(SYNC_KEY);
    if (!data) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await kv.set(SYNC_KEY, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
