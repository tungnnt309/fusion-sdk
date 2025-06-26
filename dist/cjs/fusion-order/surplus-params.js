"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurplusParams = void 0;
const tslib_1 = require("tslib");
const byte_utils_1 = require("@1inch/byte-utils");
const limit_order_sdk_1 = require("@1inch/limit-order-sdk");
const assert_1 = tslib_1.__importDefault(require("assert"));
class SurplusParams {
    constructor(estimatedTakerAmount, protocolFee) {
        this.estimatedTakerAmount = estimatedTakerAmount;
        this.protocolFee = protocolFee;
        (0, assert_1.default)(protocolFee.value % 100n == 0n, 'only integer percent supported for protocolFee');
    }
    static decodeFrom(bytes) {
        const amount = BigInt(bytes.nextUint256());
        const protocolFee = new limit_order_sdk_1.Bps(BigInt(bytes.nextUint8()) * 100n);
        return new SurplusParams(amount, protocolFee);
    }
    isZero() {
        return this.protocolFee.isZero();
    }
}
exports.SurplusParams = SurplusParams;
SurplusParams.NO_FEE = new SurplusParams(byte_utils_1.UINT_256_MAX, limit_order_sdk_1.Bps.ZERO);
//# sourceMappingURL=surplus-params.js.map