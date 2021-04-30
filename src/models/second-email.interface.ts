export interface ISecondEmail {
  user: {
    email: string;
  };
  times: {
    firstEmailTimestamp: string;
    secondEmailTimestamp: string;
    timestampDifference: string;
  };
}
