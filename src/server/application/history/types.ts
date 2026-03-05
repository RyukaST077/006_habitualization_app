export type CalendarCellStatus = "checked" | "missed" | "grace";

export interface CalendarCell {
  date: string;
  status: CalendarCellStatus;
}

export interface CalendarHistory {
  yearMonth: string;
  fromDate: string;
  toDate: string;
  days: CalendarCell[];
}
