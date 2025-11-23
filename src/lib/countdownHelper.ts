import { differenceInHours, differenceInMinutes, differenceInDays, isPast, parseISO } from "date-fns";

export interface CountdownResult {
  text: string;
  isPast: boolean;
}

export function getCountdown(dateString: string, timeString?: string | null): CountdownResult {
  try {
    // Combine date and time if available
    let targetDate: Date;
    if (timeString) {
      targetDate = parseISO(`${dateString}T${timeString}`);
    } else {
      targetDate = parseISO(`${dateString}T00:00:00`);
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
