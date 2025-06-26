import { UINT_256_MAX } from '@1inch/byte-utils';
import { Bps } from '@1inch/limit-order-sdk';
import assert from 'assert';
export class SurplusParams {
    constructor(estimatedTakerAmount, protocolFee) {
        this.estimatedTakerAmount = estimatedTakerAmount;
        this.protocolFee = protocolFee;
        assert(protocolFee.value % 100n == 0n, 'only integer percent supported for protocolFee');
    }
    static decodeFrom(bytes) {
        const amount = BigInt(bytes.nextUint256());
        const protocolFee = new Bps(BigInt(bytes.nextUint8()) * 100n);
        return new SurplusParams(amount, protocolFee);
    }
    isZero() {
        return this.protocolFee.isZero();
    }
}
SurplusParams.NO_FEE = new SurplusParams(UINT_256_MAX, Bps.ZERO);
//# sourceMappingURL=surplus-params.js.map