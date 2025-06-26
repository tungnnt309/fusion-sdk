"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmountCalculator = void 0;
const limit_order_sdk_1 = require("@1inch/limit-order-sdk");
const fee_taker_1 = require("@1inch/limit-order-sdk/extensions/fee-taker");
const auction_calculator_1 = require("./auction-calculator");
const fusion_order_1 = require("../fusion-order");
const fees_1 = require("../fusion-order/fees");
class AmountCalculator {
    constructor(auctionCalculator, feeCalculator, surplus = fusion_order_1.SurplusParams.NO_FEE) {
        this.auctionCalculator = auctionCalculator;
        this.feeCalculator = feeCalculator;
        this.surplus = surplus;
    }
    static fromExtension(ext) {
        return new AmountCalculator(auction_calculator_1.AuctionCalculator.fromAuctionData(ext.auctionDetails), ext.extra?.fees
            ? new fee_taker_1.FeeCalculator(ext.extra?.fees, ext.whitelist)
            : undefined, ext.surplus);
    }
    static calcAuctionTakingAmount(baseTakingAmount, rate, fee = limit_order_sdk_1.Bps.ZERO) {
        const withoutFee = auction_calculator_1.AuctionCalculator.calcAuctionTakingAmount(baseTakingAmount, rate);
        if (fee.isZero()) {
            return withoutFee;
        }
        const numerator = fees_1.Fees.BASE_1E5 + BigInt(fee.toFraction(fees_1.Fees.BASE_1E5));
        return (withoutFee * numerator) / fees_1.Fees.BASE_1E5;
    }
    static extractFeeAmount(requiredTakingAmount, fee) {
        return (requiredTakingAmount -
            (0, limit_order_sdk_1.mulDiv)(requiredTakingAmount, fees_1.Fees.BASE_1E5, fees_1.Fees.BASE_1E5 + BigInt(fee.toFraction(fees_1.Fees.BASE_1E5)), limit_order_sdk_1.Rounding.Ceil));
    }
    getRequiredTakingAmount(taker, takingAmount, time, blockBaseFee = 0n) {
        const withFee = this.feeCalculator?.getTakingAmount(taker, takingAmount) ??
            takingAmount;
        return this.getAuctionBumpedAmount(withFee, time, blockBaseFee);
    }
    getRequiredMakingAmount(taker, makingAmount, time, blockBaseFee = 0n) {
        const withFee = this.feeCalculator?.getMakingAmount(taker, makingAmount) ??
            makingAmount;
        const rateBump = this.auctionCalculator.calcRateBump(time, blockBaseFee);
        return auction_calculator_1.AuctionCalculator.calcAuctionMakingAmount(withFee, rateBump);
    }
    getTotalFee(taker, takingAmount, time, blockBaseFee = 0n) {
        return (this.getIntegratorFee(taker, takingAmount, time, blockBaseFee) +
            this.getProtocolFee(taker, takingAmount, time, blockBaseFee));
    }
    getUserTakingAmount(taker, makingAmount, takingAmount, orderMakingAmount, time, blockBaseFee = 0n) {
        const whole = this.getRequiredTakingAmount(taker, takingAmount, time, blockBaseFee);
        const preSurplus = whole - this.getTotalFee(taker, takingAmount, time, blockBaseFee);
        const surplusFee = this._getSurplusFee(preSurplus, makingAmount, orderMakingAmount);
        return preSurplus - surplusFee;
    }
    getSurplusFee(taker, makingAmount, takingAmount, orderMakingAmount, time, blockBaseFee = 0n) {
        const whole = this.getRequiredTakingAmount(taker, takingAmount, time, blockBaseFee);
        const preSurplus = whole - this.getTotalFee(taker, takingAmount, time, blockBaseFee);
        return this._getSurplusFee(preSurplus, makingAmount, orderMakingAmount);
    }
    getResolverFee(taker, takingAmount, time, blockBaseFee = 0n) {
        return (this.feeCalculator?.getResolverFee(taker, this.getAuctionBumpedAmount(takingAmount, time, blockBaseFee)) ?? 0n);
    }
    getIntegratorFee(taker, takingAmount, time, blockBaseFee = 0n) {
        return (this.feeCalculator?.getIntegratorFee(taker, this.getAuctionBumpedAmount(takingAmount, time, blockBaseFee)) ?? 0n);
    }
    getProtocolShareOfIntegratorFee(taker, takingAmount, time, blockBaseFee = 0n) {
        return (this.feeCalculator?.getProtocolShareOfIntegratorFee(taker, this.getAuctionBumpedAmount(takingAmount, time, blockBaseFee)) ?? 0n);
    }
    getProtocolFee(taker, takingAmount, time, blockBaseFee = 0n) {
        return (this.feeCalculator?.getProtocolFee(taker, this.getAuctionBumpedAmount(takingAmount, time, blockBaseFee)) ?? 0n);
    }
    _getSurplusFee(userTakingAmount, makingAmount, orderMakingAmount) {
        const estimatedTakingAmount = (0, limit_order_sdk_1.mulDiv)(this.surplus.estimatedTakerAmount, makingAmount, orderMakingAmount);
        if (userTakingAmount > estimatedTakingAmount) {
            const surplusFee = ((userTakingAmount - estimatedTakingAmount) *
                BigInt(this.surplus.protocolFee.toPercent())) /
                100n;
            return surplusFee;
        }
        return 0n;
    }
    getAuctionBumpedAmount(takingAmount, time, blockBaseFee = 0n) {
        const rateBump = this.auctionCalculator.calcRateBump(time, blockBaseFee);
        return auction_calculator_1.AuctionCalculator.calcAuctionTakingAmount(takingAmount, rateBump);
    }
}
exports.AmountCalculator = AmountCalculator;
//# sourceMappingURL=amount-calculator.js.map