import { NextRequest, NextResponse } from 'next/server';
import { readSchedules, writeSchedules, type DCASchedule } from '@/lib/storage';

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
    const { userId, walletId, walletAddress } = await request.json();

    if (!userId || !walletId || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const schedules = await readSchedules();
    const existingIndex = schedules.findIndex(s => s.userId === userId);

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const newSchedule: DCASchedule = {
      userId,
      walletId,
      walletAddress,
      executedWeeks: 0,
      totalWeeks: 52,
      nextExecutionTime: now, // Will be updated after first immediate execution
      isActive: true,
      createdAt: now
    };

    if (existingIndex >= 0) {
      // Reset existing schedule with new start
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

