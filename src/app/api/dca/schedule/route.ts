import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DCA_SCHEDULE_PATH = path.join(process.cwd(), 'dca-schedules.json');

interface DCASchedule {
  userId: string;
  walletId: string;
  walletAddress: string;
  amount: number;
  intervalMinutes: number;
  totalTransactions: number;
  executedTransactions: number;
  nextExecutionTime: number;
  isActive: boolean;
  createdAt: number;
}

// Helper to read schedules
async function readSchedules(): Promise<DCASchedule[]> {
  try {
    const data = await fs.readFile(DCA_SCHEDULE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write schedules
async function writeSchedules(schedules: DCASchedule[]) {
  await fs.writeFile(DCA_SCHEDULE_PATH, JSON.stringify(schedules, null, 2));
}

// GET - Get user's DCA schedule
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const schedules = await readSchedules();
    
    if (userId) {
      const userSchedule = schedules.find(s => s.userId === userId);
      return NextResponse.json(userSchedule || null);
    }
    
    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

// POST - Create/update DCA schedule
export async function POST(request: NextRequest) {
  try {
    const { userId, walletId, walletAddress, amount, intervalMinutes, totalTransactions } = await request.json();

    if (!userId || !walletId || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const schedules = await readSchedules();
    const existingIndex = schedules.findIndex(s => s.userId === userId);

    const newSchedule: DCASchedule = {
      userId,
      walletId,
      walletAddress,
      amount: amount || 1,
      intervalMinutes: intervalMinutes || 1,
      totalTransactions: totalTransactions || 5,
      executedTransactions: 0,
      nextExecutionTime: Date.now(), // Execute immediately on first cron trigger
      isActive: true,
      createdAt: Date.now()
    };

    if (existingIndex >= 0) {
      schedules[existingIndex] = newSchedule;
    } else {
      schedules.push(newSchedule);
    }

    await writeSchedules(schedules);

    return NextResponse.json({ success: true, schedule: newSchedule });
  } catch {
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

// DELETE - Cancel DCA schedule
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const schedules = await readSchedules();
    const filtered = schedules.filter(s => s.userId !== userId);
    await writeSchedules(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to cancel schedule' }, { status: 500 });
  }
}

