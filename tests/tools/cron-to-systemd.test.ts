import { describe, it, expect } from 'vitest';
import { cronToOnCalendar } from '@/lib/cron-utils';

describe('cronToOnCalendar', () => {
  describe('basic expressions', () => {
    it('converts every minute', () => {
      expect(cronToOnCalendar('* * * * *')).toBe('*-*-* *:*:00');
    });

    it('converts daily at midnight', () => {
      expect(cronToOnCalendar('0 0 * * *')).toBe('*-*-* 00:00:00');
    });

    it('converts specific time daily', () => {
      expect(cronToOnCalendar('30 14 * * *')).toBe('*-*-* 14:30:00');
    });

    it('converts hourly (at minute 0)', () => {
      expect(cronToOnCalendar('0 * * * *')).toBe('*-*-* *:00:00');
    });
  });

  describe('day of week', () => {
    it('converts weekday range (Mon-Fri)', () => {
      expect(cronToOnCalendar('0 9 * * 1-5')).toBe('Mon..Fri *-*-* 09:00:00');
    });

    it('converts single day of week', () => {
      expect(cronToOnCalendar('0 0 * * 0')).toBe('Sun *-*-* 00:00:00');
    });

    it('converts day of week list', () => {
      expect(cronToOnCalendar('0 8 * * 1,3,5')).toBe('Mon,Wed,Fri *-*-* 08:00:00');
    });

    it('converts */2 day of week by expanding', () => {
      expect(cronToOnCalendar('0 0 * * */2')).toBe('Sun,Tue,Thu,Sat *-*-* 00:00:00');
    });
  });

  describe('day of month', () => {
    it('converts specific day of month', () => {
      expect(cronToOnCalendar('0 0 1 * *')).toBe('*-*-1 00:00:00');
    });

    it('converts day of month list', () => {
      expect(cronToOnCalendar('30 4 1,15 * *')).toBe('*-*-1,15 04:30:00');
    });

    it('converts day of month range', () => {
      expect(cronToOnCalendar('0 0 1-7 * *')).toBe('*-*-1..7 00:00:00');
    });
  });

  describe('month', () => {
    it('converts specific month', () => {
      expect(cronToOnCalendar('0 0 1 6 *')).toBe('*-6-1 00:00:00');
    });

    it('converts month range', () => {
      expect(cronToOnCalendar('0 0 * 1-6 *')).toBe('*-1..6-* 00:00:00');
    });

    it('converts month list', () => {
      expect(cronToOnCalendar('0 0 1 3,6,9,12 *')).toBe('*-3,6,9,12-1 00:00:00');
    });

    it('converts month interval', () => {
      expect(cronToOnCalendar('0 0 1 */3 *')).toBe('*-*/3-1 00:00:00');
    });
  });

  describe('intervals (*/N)', () => {
    it('converts every 5 minutes', () => {
      expect(cronToOnCalendar('*/5 * * * *')).toBe('*-*-* *:00/5:00');
    });

    it('converts every 2 hours', () => {
      expect(cronToOnCalendar('0 */2 * * *')).toBe('*-*-* 00/2:00:00');
    });

    it('converts every 15 minutes', () => {
      expect(cronToOnCalendar('*/15 * * * *')).toBe('*-*-* *:00/15:00');
    });
  });

  describe('combined expressions', () => {
    it('converts weekdays at 9am and 5pm (hour list not standard but handled)', () => {
      expect(cronToOnCalendar('0 9,17 * * 1-5')).toBe('Mon..Fri *-*-* 9,17:00:00');
    });

    it('converts quarterly on the 1st at midnight', () => {
      expect(cronToOnCalendar('0 0 1 1,4,7,10 *')).toBe('*-1,4,7,10-1 00:00:00');
    });
  });

  describe('zero padding', () => {
    it('zero-pads single-digit minutes', () => {
      expect(cronToOnCalendar('5 0 * * *')).toBe('*-*-* 00:05:00');
    });

    it('zero-pads single-digit hours', () => {
      expect(cronToOnCalendar('0 3 * * *')).toBe('*-*-* 03:00:00');
    });

    it('does not zero-pad day of month', () => {
      expect(cronToOnCalendar('0 0 5 * *')).toBe('*-*-5 00:00:00');
    });
  });

  describe('invalid input', () => {
    it('returns null for too few fields', () => {
      expect(cronToOnCalendar('* * *')).toBeNull();
    });

    it('returns null for too many fields', () => {
      expect(cronToOnCalendar('* * * * * *')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(cronToOnCalendar('')).toBeNull();
    });
  });
});
