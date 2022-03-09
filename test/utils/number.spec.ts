import { parseNumber } from "src/utils/number";

const validNumbers = {
  "-5": -5,
  "-0": -0,
  "0": 0,
  "5": 5,
  "123": 123,
  "123.456": 123.456,
  "123.456e7": 123.456e7,
  "123.456E7": 123.456e7,
  "123.456e-7": 123.456e-7,
  "123.456E-7": 123.456e-7,
  "123.456e+7": 123.456e7,
  "123.456E+7": 123.456e7
};

const validNumbersAsStrings = Object.keys(validNumbers) as (keyof typeof validNumbers)[];
const validNumbersAsNumbers = Object.values(validNumbers) as number[];

const invalidNumbersAsStrings = ["", " ", "a", "1a", "1.a", "1.1a", "1.1.1"];

describe("number utils", () => {
  describe("parseNumber", () => {
    validNumbersAsStrings.forEach(validNumberAsString =>
      it(`should correctly convert ${validNumberAsString} from a string to a number`, () => {
        const result = parseNumber(validNumberAsString, 0);

        expect(result).toBe(validNumbers[validNumberAsString]);
      })
    );

    validNumbersAsNumbers.forEach(validNumber =>
      it(`should return the fallback value ${validNumber} when given undefined`, () => {
        const result = parseNumber(undefined, validNumber);

        expect(result).toBe(validNumber);
      })
    );

    validNumbersAsNumbers.forEach(validNumber =>
      it(`should return the fallback value ${validNumber} when given null`, () => {
        const result = parseNumber(null, validNumber);

        expect(result).toBe(validNumber);
      })
    );

    invalidNumbersAsStrings.forEach(invalidNumbersAsString =>
      it(`should return the fallback value when given '${invalidNumbersAsString}'`, () => {
        const callbackNumber = 5;

        const result = parseNumber(invalidNumbersAsString, callbackNumber);

        expect(result).toBe(callbackNumber);
      })
    );
  });
});
