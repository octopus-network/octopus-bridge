import { BigNumber } from "bignumber.js";

export function fromDecimals(numStr, decimals = 24) {
  return new BigNumber(numStr).div(Math.pow(10, decimals)).toNumber();
}

export function toDecimals(num, decimals = 24) {
  return new BigNumber(num).multipliedBy(10 ** (decimals)).toString(10);
}
