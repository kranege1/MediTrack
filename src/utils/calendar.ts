export function generateICS(title: string, dateStr: string, timeStr: string, location: string = '', note: string = '') {
  // Format: YYYYMMDDTHHMMSSZ
  const dateParts = dateStr.split('-');
  const timeParts = (timeStr || '00:00').split(':');
  
  const start = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    parseInt(timeParts[0]),
    parseInt(timeParts[1])
  );
  
  const end = new Date(start.getTime() + 30 * 60000); // 30 min duration
  
  const formatVal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MedicaTrack//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatVal(start)}`,
    `DTEND:${formatVal(end)}`,
    `SUMMARY:${title}`,
    location ? `LOCATION:${location}` : '',
    note ? `DESCRIPTION:${note}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');
  
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
