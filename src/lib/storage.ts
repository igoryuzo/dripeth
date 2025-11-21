import { kv } from '@vercel/kv';

export interface DCASchedule {
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

const SCHEDULES_KEY = 'dca:schedules';

export async function readSchedules(): Promise<DCASchedule[]> {
  try {
    const schedules = await kv.get<DCASchedule[]>(SCHEDULES_KEY);
    return schedules || [];
  } catch (error) {
    console.error('Failed to read schedules from KV:', error);
    return [];
  }
}

export async function writeSchedules(schedules: DCASchedule[]): Promise<void> {
  try {
    await kv.set(SCHEDULES_KEY, schedules);
  } catch (error) {
    console.error('Failed to write schedules to KV:', error);
    throw error;
  }
}

export async function getScheduleByWalletId(walletId: string): Promise<DCASchedule | null> {
  const schedules = await readSchedules();
  return schedules.find(s => s.walletId === walletId) || null;
}

export async function addSchedule(schedule: DCASchedule): Promise<void> {
  const schedules = await readSchedules();
  schedules.push(schedule);
  await writeSchedules(schedules);
}

export async function updateSchedule(walletId: string, updates: Partial<DCASchedule>): Promise<void> {
  const schedules = await readSchedules();
  const index = schedules.findIndex(s => s.walletId === walletId);
  if (index !== -1) {
    schedules[index] = { ...schedules[index], ...updates };
    await writeSchedules(schedules);
  }
}

export async function deleteSchedule(walletId: string): Promise<void> {
  const schedules = await readSchedules();
  const filtered = schedules.filter(s => s.walletId !== walletId);
  await writeSchedules(filtered);
}

