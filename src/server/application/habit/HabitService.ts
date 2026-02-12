import { AuthorizationPolicyService } from '../authz/AuthorizationPolicyService';
import { AuditLogger } from '../../common/audit/AuditLogger';
import { forbiddenHabitAction, invalidHabitInput } from './HabitErrors';
import type {
  CreateHabitInput,
  Habit,
  HabitStatus,
  HabitTransitionInput,
  UpdateHabitInput,
  UpdateHabitPayload,
} from './HabitTypes';
import type { HabitRepository } from '../../infrastructure/repositories/HabitRepository';

const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 80;
const DISPLAY_ORDER_MIN = 1;
const DISPLAY_ORDER_MAX = 9999;

function assertName(name: string): void {
  const normalized = name.trim();
  if (normalized.length < NAME_MIN_LENGTH || normalized.length > NAME_MAX_LENGTH) {
    throw invalidHabitInput('name must be between 1 and 80 characters');
  }
}

function assertDisplayOrder(displayOrder: number): void {
  if (
    !Number.isInteger(displayOrder) ||
    displayOrder < DISPLAY_ORDER_MIN ||
    displayOrder > DISPLAY_ORDER_MAX
  ) {
    throw invalidHabitInput('displayOrder must be an integer between 1 and 9999');
  }
}

function assertUpdatePayload(payload: UpdateHabitPayload): void {
  if (payload.name === undefined && payload.displayOrder === undefined) {
    throw invalidHabitInput('at least one mutable field is required');
  }

  if (payload.name !== undefined) {
    assertName(payload.name);
  }

  if (payload.displayOrder !== undefined) {
    assertDisplayOrder(payload.displayOrder);
  }
}

export class HabitService {
  constructor(
    private readonly repository: HabitRepository,
    private readonly authz: AuthorizationPolicyService = new AuthorizationPolicyService(),
    private readonly auditLogger: AuditLogger = new AuditLogger(),
  ) {}

  async createHabit(input: CreateHabitInput): Promise<Habit> {
    assertName(input.name);
    assertDisplayOrder(input.displayOrder);

    const habit = await this.repository.createHabit(input.userId, input.name, input.displayOrder);

    this.auditLogger.log({
      audit: true,
      action: 'HABIT_CREATE',
      result: 'success',
      trace_id: `habit-${habit.id}-create`,
      actorId: input.userId,
      detail: { habitId: habit.id, status: habit.status },
    });

    return habit;
  }

  async updateHabit(input: UpdateHabitInput): Promise<Habit> {
    this.authz.assertSelf(input.userId, input.userId);
    const payload: UpdateHabitPayload = {
      name: input.name,
      displayOrder: input.displayOrder,
    };

    assertUpdatePayload(payload);

    const habit = await this.repository.updateHabit(input.userId, input.habitId, payload);

    this.auditLogger.log({
      audit: true,
      action: 'HABIT_UPDATE',
      result: 'success',
      trace_id: `habit-${habit.id}-update`,
      actorId: input.userId,
      detail: { habitId: habit.id, status: habit.status },
    });

    return habit;
  }

  async archiveHabit(input: { userId: string; habitId: string }): Promise<Habit> {
    return this.transitionHabitStatus(input, 'archived', 'HABIT_ARCHIVE', 'archive');
  }

  async resumeHabit(input: { userId: string; habitId: string }): Promise<Habit> {
    return this.transitionHabitStatus(input, 'active', 'HABIT_RESUME', 'resume');
  }

  private async transitionHabitStatus(
    input: HabitTransitionInput,
    status: HabitStatus,
    auditAction: 'HABIT_ARCHIVE' | 'HABIT_RESUME',
    traceSuffix: 'archive' | 'resume',
  ): Promise<Habit> {
    this.authz.assertSelf(input.userId, input.userId);
    const habit = await this.repository.setHabitStatus(input.userId, input.habitId, status);
    if (habit.userId !== input.userId) {
      throw forbiddenHabitAction();
    }

    const detail = this.buildHabitStatusAuditDetail(habit);
    this.auditLogger.log({
      audit: true,
      action: auditAction,
      result: 'success',
      trace_id: `habit-${habit.id}-${traceSuffix}`,
      actorId: input.userId,
      detail,
    });

    return habit;
  }

  private buildHabitStatusAuditDetail(habit: Habit): { habitId: string; status: HabitStatus } {
    return { habitId: habit.id, status: habit.status };
  }
}
