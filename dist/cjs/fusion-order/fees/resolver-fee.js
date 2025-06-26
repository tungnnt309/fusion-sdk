"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolverFee = void 0;
const tslib_1 = require("tslib");
const limit_order_sdk_1 = require("@1inch/limit-order-sdk");
const assert_1 = tslib_1.__importDefault(require("assert"));
class ResolverFee {
    constructor(receiver, fee, whitelistDiscount = limit_order_sdk_1.Bps.ZERO) {
        this.receiver = receiver;
        this.fee = fee;
        this.whitelistDiscount = whitelistDiscount;
        if (receiver.isZero() && !fee.isZero()) {
            throw new Error('fee must be zero if receiver is zero address');
        }
        if (fee.isZero() && !whitelistDiscount.isZero()) {
            throw new Error('whitelist discount must be zero if fee is zero');
        }
        (0, assert_1.default)(this.whitelistDiscount.value % 100n === 0n, `whitelist discount must have percent precision: 1%, 2% and so on`);
    }
}
exports.ResolverFee = ResolverFee;
ResolverFee.ZERO = new ResolverFee(limit_order_sdk_1.Address.ZERO_ADDRESS, limit_order_sdk_1.Bps.ZERO);
//# sourceMappingURL=resolver-fee.js.map