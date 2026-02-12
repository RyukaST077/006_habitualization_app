export type HabitStatus = 'active' | 'archived';

export type Habit = {
  id: string;
  userId: string;
  name: string;
  displayOrder: number;
  status: HabitStatus;
  archivedAt: string | null;
};

export type CreateHabitInput = {
  userId: string;
  name: string;
  displayOrder: number;
};

export type UpdateHabitInput = {
  userId: string;
  habitId: string;
  name?: string;
  displayOrder?: number;
};

export type UpdateHabitPayload = Pick<UpdateHabitInput, 'name' | 'displayOrder'>;

export type SetHabitStatusInput = {
  userId: string;
  habitId: string;
  status: HabitStatus;
};

export type HabitServicePort = {
  createHabit(input: CreateHabitInput): Promise<Habit>;
  updateHabit(input: UpdateHabitInput): Promise<Habit>;
  archiveHabit(input: Omit<SetHabitStatusInput, 'status'>): Promise<Habit>;
  resumeHabit(input: Omit<SetHabitStatusInput, 'status'>): Promise<Habit>;
};
