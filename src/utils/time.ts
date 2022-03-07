import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export const getCurrentTimestampUTC = (): number => {
  return dayjs().unix();
};

export const printTimestamp = (timestamp: number): string => {
  return dayjs.unix(timestamp).format("h:mm:ssa, D MMMM YYYY") + " UTC";
};

export const getDifferenceBetweenTimestamps = (first: number, second: number): string => {
  const firstDayjs = dayjs.unix(first);
  const secondDayjs = dayjs.unix(second);

  const difference = secondDayjs.diff(firstDayjs);
  const emailDuration = dayjs.duration(difference);

  return `${Math.floor(
    emailDuration.asDays()
  )} days, ${emailDuration.hours()} hours, ${emailDuration.minutes()} minutes, and ${emailDuration.seconds()} seconds`;
};
