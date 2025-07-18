"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoterRequest = void 0;
const limit_order_sdk_1 = require("@1inch/limit-order-sdk");
const validations_1 = require("../../validations");
class QuoterRequest {
    constructor(params) {
        this.fromTokenAddress = new limit_order_sdk_1.Address(params.fromTokenAddress);
        this.toTokenAddress = new limit_order_sdk_1.Address(params.toTokenAddress);
        this.amount = params.amount;
        this.walletAddress = new limit_order_sdk_1.Address(params.walletAddress);
        this.enableEstimate = params.enableEstimate || false;
        this.permit = params.permit;
        this.integratorFee = params.integratorFee;
        this.source = params.source || 'sdk';
        this.isPermit2 = params.isPermit2 ?? false;
        this.slippage = params.slippage;
        if (this.fromTokenAddress.isNative()) {
            throw new Error(`cannot swap ${limit_order_sdk_1.Address.NATIVE_CURRENCY}: wrap native currency to it's wrapper fist`);
        }
        if (this.fromTokenAddress.isZero() || this.toTokenAddress.isZero()) {
            throw new Error(`replace ${limit_order_sdk_1.Address.ZERO_ADDRESS} with ${limit_order_sdk_1.Address.NATIVE_CURRENCY}`);
        }
        if (this.fromTokenAddress.equal(this.toTokenAddress)) {
            throw new Error('fromTokenAddress and toTokenAddress should be different');
        }
        if (!(0, validations_1.isValidAmount)(this.amount)) {
            throw new Error(`${this.amount} is invalid amount`);
        }
        if (this.integratorFee && this.source === 'sdk') {
            throw new Error('cannot use fee without source');
        }
    }
    static new(params) {
        return new QuoterRequest(params);
    }
    build() {
        return {
            fromTokenAddress: this.fromTokenAddress.toString(),
            toTokenAddress: this.toTokenAddress.toString(),
            amount: this.amount,
            walletAddress: this.walletAddress.toString(),
            enableEstimate: this.enableEstimate,
            permit: this.permit,
            fee: Number(this.integratorFee?.value.value || 0),
            source: this.source,
            isPermit2: this.isPermit2,
            surplus: true,
            slippage: this.slippage
        };
    }
}
exports.QuoterRequest = QuoterRequest;
//# sourceMappingURL=quoter.request.js.map