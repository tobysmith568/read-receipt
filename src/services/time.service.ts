import dayjs from "dayjs";
import { singleton } from "tsyringe";
import * as duration from "dayjs/plugin/duration";

dayjs.extend(duration);

@singleton()
export class TimeService {
  public getCurrentTimestampUTC(): number {
    return dayjs().unix();
  }

  public printTimestamp(timestamp: number): string {
    return dayjs.unix(timestamp).format("h:mm:ssa, D MMMM YYYY");
  }

  public getDifferenceBetweenTimestamps(first: number, second: number): string {
    const firstDayjs = dayjs.unix(first);
    const secondDayjs = dayjs.unix(second);

    const difference = secondDayjs.diff(firstDayjs);
    const emailDuration = dayjs.duration(difference);

    return `${Math.floor(
      emailDuration.asDays()
    )} days, ${emailDuration.hours()} hours, ${emailDuration.minutes()} minutes, and ${emailDuration.seconds()} seconds`;
  }
}
