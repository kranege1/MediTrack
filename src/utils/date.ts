export function isPlanDueOnDate(plan: any, date: Date) {
  const start = new Date(plan.startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target < start) return false;

  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000);

  if (plan.isOneTime) {
    return diffDays === 0;
  }

  const freq = plan.frequency || 'daily';
  if (freq === 'daily') return true;

  if (freq === 'weekly') {
    return target.getDay() === (parseInt(plan.startWeekday) || 1);
  }

  if (freq === 'monthly') {
    return target.getDate() === (parseInt(plan.startDayOfMonth) || 1);
  }

  if (freq === 'everyXDays') {
    const x = parseInt(plan.intervalX) || 1;
    return diffDays % x === 0;
  }

  return false;
}
