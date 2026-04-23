import { i18n, APP_VERSION } from './constants.js';
import { state } from './state.js';

export function t(key) {
  if (!key) return '';
  const lang = state.lang || 'en';
  const val = i18n[lang][key] || i18n['en'][key] || key;
  return val;
}

export function _uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try { return crypto.randomUUID(); } catch (e) { /* fall through */ }
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

export function _isPlanDueOnDate(plan, date) {
  const start = new Date(plan.startDate);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target < start) return false;

  const diffDays = Math.floor((target - start) / 86400000);

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

export function _generateICS(events) {
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsItems = events.map(e => {
    const desc = (e.description || '').replace(/\n/g, '\\n');
    const loc = (e.location || '').replace(/\n/g, '\\n');
    return [
      'BEGIN:VEVENT',
      `UID:${_uuid()}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(e.start)}`,
      `DTEND:${formatICSDate(new Date(e.start.getTime() + 30 * 60 * 1000))}`,
      `SUMMARY:💊 ${e.title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedicaTrack//Schedule//EN',
    icsItems,
    'END:VCALENDAR'
  ].join('\r\n');
}

export function _downloadFile(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Expose to window for inline HTML handlers
window.t = t;
window._isPlanDueOnDate = _isPlanDueOnDate;
