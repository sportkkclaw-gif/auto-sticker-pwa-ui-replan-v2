import { NextRequest, NextResponse } from 'next/server';
import { grantStage2Credits } from '@/lib/stage2';
export async function POST(req:NextRequest){ const body=await req.json().catch(()=>({})); return NextResponse.json(grantStage2Credits(Number(body.amount ?? 80), body.description)); }
