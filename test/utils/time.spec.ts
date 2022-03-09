import mockDate from "mockdate";
import {
  getCurrentTimestampUTC,
  getDifferenceBetweenTimestamps,
  printTimestamp
} from "src/utils/time";

const currentTimestamp = 1646861851;
const currentTimestampAsDate = new Date(2022, 2, 9, 21, 37, 31, 123);
const currentTimestampFormatted = "9:37:31pm, 9 March 2022 UTC";

describe("time utils", () => {
  beforeAll(() => {
    mockDate.set(currentTimestampAsDate);
  });

  afterAll(() => {
    mockDate.reset();
  });

  describe("getCurrentTimestampUTC", () => {
    it("should return current timestamp in UTC", () => {
      const result = getCurrentTimestampUTC();

      expect(result).toBe(currentTimestamp);
    });
  });

  describe("printTimestamp", () => {
    [
      { timestamp: 1480274661, expected: "7:24:21pm, 27 November 2016 UTC" },
      { timestamp: currentTimestamp, expected: currentTimestampFormatted },
      { timestamp: 1804660354, expected: "6:32:34am, 10 March 2027 UTC" }
    ].forEach(testCase =>
      it(`should return ${testCase.timestamp} formatted as ${testCase.expected}`, () => {
        const result = printTimestamp(testCase.timestamp);

        expect(result).toBe(testCase.expected);
      })
    );
  });

  describe("getDifferenceBetweenTimestamps", () => {
    [
      {
        first: currentTimestamp,
        second: currentTimestamp,
        expected: "0 days, 0 hours, 0 minutes, and 0 seconds"
      },
      {
        first: currentTimestamp,
        second: currentTimestamp + 1,
        expected: "0 days, 0 hours, 0 minutes, and 1 seconds"
      },
      {
        first: currentTimestamp,
        second: currentTimestamp + 60,
        expected: "0 days, 0 hours, 1 minutes, and 0 seconds"
      },
      {
        first: currentTimestamp,
        second: currentTimestamp + 60 * 60,
        expected: "0 days, 1 hours, 0 minutes, and 0 seconds"
      },
      {
        first: currentTimestamp,
        second: currentTimestamp + 60 * 60 * 24,
        expected: "1 days, 0 hours, 0 minutes, and 0 seconds"
      },
      {
        first: currentTimestamp,
        second: currentTimestamp + 60 * 60 * 24 * 100,
        expected: "100 days, 0 hours, 0 minutes, and 0 seconds"
      },
      {
        first: currentTimestamp,
        second: currentTimestamp + 60 * 60 * 24 + 60 * 60 + 60 + 1,
        expected: "1 days, 1 hours, 1 minutes, and 1 seconds"
      }
    ].forEach(testCase =>
      it(`should correctly return the difference between ${testCase.first} and ${testCase.second}`, () => {
        const result = getDifferenceBetweenTimestamps(testCase.first, testCase.second);

        expect(result).toBe(testCase.expected);
      })
    );

    it("should throw if the second timestamp is less than the first", () => {
      expect(() => getDifferenceBetweenTimestamps(currentTimestamp, currentTimestamp - 1)).toThrow(
        "The second timestamp must be greater than first timestamp"
      );
    });
  });
});
