export interface ISecondEmail {
  user: {
    email: string;
    ip: string;
  };
  times: {
    firstEmailTimestamp: string;
    secondEmailTimestamp: string;
    timestampDifference: string;
  };
}
