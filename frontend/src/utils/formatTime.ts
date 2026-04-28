import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
  parseISO,
  isValid,
} from "date-fns";

const safeParse = (dateString: string) => {
  const date = parseISO(dateString);
  return isValid(date) ? date : null;
};

export const formatTime = (dateString: string): string => {
  try {
    const date = safeParse(dateString);
    if (!date) return "";
    return format(date, "HH:mm");
  } catch {
    return "";
  }
};

export const formatDate = (dateString: string): string => {
  try {
    const date = safeParse(dateString);
    if (!date) return "";

    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";

    return format(date, "MMMM d, yyyy");
  } catch {
    return "";
  }
};

export const formatLastSeen = (dateString: string): string => {
  try {
    const date = safeParse(dateString);
    if (!date) return "a while ago";

    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "a while ago";
  }
};