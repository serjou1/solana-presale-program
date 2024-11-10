import * as anchor from '@coral-xyz/anchor';
import { TOKEN_DECIMALS, USDT_DECIMALS } from './constants';

export const getTokenPriceBn = (
    tokenPrice: number
) => {
    return new anchor.BN(tokenPrice * 10 ** (USDT_DECIMALS));
};

export const getAmountUsdtToBuyBn = (amount: number) => {
    return new anchor.BN(amount * 10 ** (USDT_DECIMALS));
};

export const getExpectedAmountOfTokensBn = (amount: number) => {
    return new anchor.BN(amount * 10 ** (TOKEN_DECIMALS));
};

export const bigNumberToBigInt = (bn: anchor.BN) => {
    return BigInt(bn.toString());
}