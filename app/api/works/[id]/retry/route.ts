import { NextRequest, NextResponse } from 'next/server';
import { retryStage2Work } from '@/lib/stage2';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){ const {id}=await params; const body=await req.json().catch(()=>({})); const result=retryStage2Work(id, req.headers.get('idempotency-key') || body.idempotency_key); if(!result.ok) return NextResponse.json(result,{status:result.status}); return NextResponse.json(result); }
