import { differenceInHours, differenceInMinutes, differenceInDays, isPast, parseISO } from "date-fns";

export interface CountdownResult {
  text: string;
  isPast: boolean;
}

// Helper to parse date strings in local timezone
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Try ISO format first
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Parse YYYY-MM-DD as local date
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getCountdown(dateString: string, timeString?: string | null): CountdownResult {
  try {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    let targetDate: Date;
    
    if (timeString) {
      // Handle HH:MM format by appending :00 for seconds
      const cleanTime = timeString.length === 5 ? `${timeString}:00` : timeString;
      const [hours, minutes, seconds] = cleanTime.split(':').map(Number);
      targetDate = new Date(year, month - 1, day, hours, minutes, seconds);
    } else {
      targetDate = new Date(year, month - 1, day);
    }

    const now = new Date();
    
    if (isPast(targetDate)) {
      return {
        text: "",
        isPast: true
      };
    }

    const days = differenceInDays(targetDate, now);
    const hours = differenceInHours(targetDate, now);
    const minutes = differenceInMinutes(targetDate, now);

    if (days > 7) {
      return {
        text: "",
        isPast: false
      };
    }

    if (days >= 1) {
      return {
        text: `${days}d to go`,
        isPast: false
      };
    }

    if (hours >= 1) {
      return {
        text: `${hours}h to go`,
        isPast: false
      };
    }

    if (minutes >= 1) {
      return {
        text: `${minutes}m to go`,
        isPast: false
      };
    }

    return {
      text: "Starting soon!",
      isPast: false
    };
  } catch (error) {
    console.error("Error calculating countdown:", error);
    return {
      text: "",
      isPast: false
    };
  }
}
