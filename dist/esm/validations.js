import { isAddress } from 'ethers';
export function isValidAddress(address) {
    return isAddress(address);
}
export function isValidAmount(value) {
    try {
        const amount = BigInt(value);
        return amount >= 0n;
    }
    catch {
        return false;
    }
}
const HEX_REGEX = /^(0x)[0-9a-f]+$/i;
export function isHexString(val) {
    return HEX_REGEX.test(val.toLowerCase());
}
export function isHexBytes(val) {
    return isHexString(val) && val.length % 2 === 0;
}
//# sourceMappingURL=validations.js.map