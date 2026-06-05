import { NextResponse } from 'next/server';
import { TransactionRepository } from '@/lib/stage2';
export async function GET(){ return NextResponse.json({ transactions: TransactionRepository.list() }); }
