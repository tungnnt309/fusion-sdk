import { Bps, mulDiv, Rounding } from '@1inch/limit-order-sdk';
import { FeeCalculator } from '@1inch/limit-order-sdk/extensions/fee-taker';
import { AuctionCalculator } from './auction-calculator';
import { SurplusParams } from '../fusion-order';
import { Fees } from '../fusion-order/fees';
export class AmountCalculator {
    constructor(auctionCalculator, feeCalculator, surplus = SurplusParams.NO_FEE) {
        this.auctionCalculator = auctionCalculator;
        this.feeCalculator = feeCalculator;
        this.surplus = surplus;
    }
    static fromExtension(ext) {
        return new AmountCalculator(AuctionCalculator.fromAuctionData(ext.auctionDetails), ext.extra?.fees
            ? new FeeCalculator(ext.extra?.fees, ext.whitelist)
            : undefined, ext.surplus);
    }
    static calcAuctionTakingAmount(baseTakingAmount, rate, fee = Bps.ZERO) {
        const withoutFee = AuctionCalculator.calcAuctionTakingAmount(baseTakingAmount, rate);
        if (fee.isZero()) {
            return withoutFee;
        }
        const numerator = Fees.BASE_1E5 + BigInt(fee.toFraction(Fees.BASE_1E5));
        return (withoutFee * numerator) / Fees.BASE_1E5;
    }
    static extractFeeAmount(requiredTakingAmount, fee) {
        return (requiredTakingAmount -
            mulDiv(requiredTakingAmount, Fees.BASE_1E5, Fees.BASE_1E5 + BigInt(fee.toFraction(Fees.BASE_1E5)), Rounding.Ceil));
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
        return AuctionCalculator.calcAuctionMakingAmount(withFee, rateBump);
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
        const estimatedTakingAmount = mulDiv(this.surplus.estimatedTakerAmount, makingAmount, orderMakingAmount);
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
        return AuctionCalculator.calcAuctionTakingAmount(takingAmount, rateBump);
    }
}
//# sourceMappingURL=amount-calculator.js.map