export const dailyBriefSchedule = {
  id: "daily-brief",
  cron: "0 8 * * 1-5",
  timezone: "user-local",
  task: "Prepare a cited daily brief from permitted mail, calendar, and documents.",
} as const;
