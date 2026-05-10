import { format, isValid } from 'date-fns';

export const formatDateTime = (value: string, pattern: string = 'PPPp', fallback: string = 'Not available'): string => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return fallback;
  }

  return format(date, pattern);
};
