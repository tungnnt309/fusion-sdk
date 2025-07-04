import { Address, Interaction, LimitOrder, MakerTraits } from '@1inch/limit-order-sdk';
import assert from 'assert';
import { FusionExtension } from './fusion-extension';
import { injectTrackCode } from './source-track';
import { SurplusParams } from './surplus-params';
import { AuctionCalculator } from '../amount-calculator/auction-calculator';
import { ZX } from '../constants';
import { calcTakingAmount } from '../utils/amounts';
import { now } from '../utils/time';
import { AmountCalculator } from '../amount-calculator/amount-calculator';
export class FusionOrder {
    constructor(settlementExtensionContract, orderInfo, auctionDetails, whitelist, surplusParams = SurplusParams.NO_FEE, extra = FusionOrder.defaultExtra, extension = new FusionExtension(settlementExtensionContract, auctionDetails, whitelist, surplusParams, {
        makerPermit: extra.permit
            ? new Interaction(orderInfo.makerAsset, extra.permit)
            : undefined,
        customReceiver: orderInfo.receiver,
        fees: extra?.fees
    })) {
        this.settlementExtensionContract = settlementExtensionContract;
        const allowPartialFills = extra.allowPartialFills ??
            FusionOrder.defaultExtra.allowPartialFills;
        const allowMultipleFills = extra.allowMultipleFills ??
            FusionOrder.defaultExtra.allowMultipleFills;
        const unwrapWETH = extra.unwrapWETH ?? FusionOrder.defaultExtra.unwrapWETH;
        const enablePermit2 = extra.enablePermit2 ?? FusionOrder.defaultExtra.enablePermit2;
        const orderExpirationDelay = extra.orderExpirationDelay ??
            FusionOrder.defaultExtra.orderExpirationDelay;
        const deadline = auctionDetails.startTime +
            auctionDetails.duration +
            orderExpirationDelay;
        const makerTraits = MakerTraits.default()
            .withExpiration(deadline)
            .setPartialFills(allowPartialFills)
            .setMultipleFills(allowMultipleFills)
            .enablePostInteraction();
        if (makerTraits.isBitInvalidatorMode()) {
            assert(extra.nonce !== undefined, 'Nonce required, when partial fill or multiple fill disallowed');
        }
        if (unwrapWETH) {
            makerTraits.enableNativeUnwrap();
        }
        if (enablePermit2) {
            makerTraits.enablePermit2();
        }
        if (extra.nonce !== undefined) {
            makerTraits.withNonce(extra.nonce);
        }
        const receiver = extra.fees || !surplusParams.isZero()
            ? settlementExtensionContract
            : orderInfo.receiver;
        const builtExtension = extension.build();
        const salt = LimitOrder.buildSalt(builtExtension, orderInfo.salt);
        const saltWithInjectedTrackCode = orderInfo.salt
            ? salt
            : injectTrackCode(salt, extra.source);
        this.inner = new LimitOrder({
            ...orderInfo,
            receiver,
            salt: saltWithInjectedTrackCode
        }, makerTraits, builtExtension);
        this.fusionExtension = extension;
    }
    get extension() {
        return this.inner.extension;
    }
    get maker() {
        return this.inner.maker;
    }
    get takerAsset() {
        return this.inner.takerAsset;
    }
    get makerAsset() {
        return this.inner.makerAsset;
    }
    get takingAmount() {
        return this.inner.takingAmount;
    }
    get makingAmount() {
        return this.inner.makingAmount;
    }
    get realReceiver() {
        const hasFee = Boolean(this.fusionExtension.extra?.fees);
        const receiver = hasFee
            ? this.fusionExtension.extra?.customReceiver
            : this.inner.receiver;
        return receiver && !receiver.isZero() ? receiver : this.maker;
    }
    get receiver() {
        return this.inner.receiver;
    }
    get deadline() {
        return this.inner.makerTraits.expiration() || 0n;
    }
    get auctionStartTime() {
        return this.fusionExtension.auctionDetails.startTime;
    }
    get auctionEndTime() {
        const { startTime, duration } = this.fusionExtension.auctionDetails;
        return startTime + duration;
    }
    get isBitInvalidatorMode() {
        return this.inner.makerTraits.isBitInvalidatorMode();
    }
    get partialFillAllowed() {
        return this.inner.makerTraits.isPartialFillAllowed();
    }
    get multipleFillsAllowed() {
        return this.inner.makerTraits.isMultipleFillsAllowed();
    }
    get nonce() {
        return this.inner.makerTraits.nonceOrEpoch();
    }
    get salt() {
        return this.inner.salt;
    }
    static new(settlementExtension, orderInfo, details, extra) {
        return new FusionOrder(settlementExtension, orderInfo, details.auction, details.whitelist, details.surplus, extra);
    }
    static fromDataAndExtension(order, extension) {
        const settlementContract = Address.fromFirstBytes(extension.makingAmountData);
        assert(Address.fromFirstBytes(extension.takingAmountData).equal(settlementContract) &&
            Address.fromFirstBytes(extension.postInteraction).equal(settlementContract), 'Invalid extension, all calls should be to the same address');
        const makerTraits = new MakerTraits(BigInt(order.makerTraits));
        assert(!makerTraits.isPrivate(), 'fusion order can not be private');
        assert(makerTraits.hasPostInteraction(), 'post-interaction must be enabled');
        const { auctionDetails, whitelist, extra, surplus } = FusionExtension.fromExtension(extension);
        const deadline = makerTraits.expiration();
        const orderExpirationDelay = deadline === null
            ? undefined
            : deadline - auctionDetails.startTime - auctionDetails.duration;
        const providedSalt = BigInt(order.salt);
        const fusionOrder = new FusionOrder(settlementContract, {
            salt: providedSalt >> 160n,
            maker: new Address(order.maker),
            receiver: extra?.customReceiver,
            makerAsset: new Address(order.makerAsset),
            takerAsset: new Address(order.takerAsset),
            makingAmount: BigInt(order.makingAmount),
            takingAmount: BigInt(order.takingAmount)
        }, auctionDetails, whitelist, surplus, {
            allowMultipleFills: makerTraits.isMultipleFillsAllowed(),
            allowPartialFills: makerTraits.isPartialFillAllowed(),
            enablePermit2: makerTraits.isPermit2(),
            nonce: makerTraits.nonceOrEpoch(),
            permit: extension.makerPermit === ZX
                ? undefined
                : Interaction.decode(extension.makerPermit).data,
            unwrapWETH: makerTraits.isNativeUnwrapEnabled(),
            orderExpirationDelay,
            fees: extra?.fees
        });
        assert(providedSalt === fusionOrder.salt, 'invalid salt for passed extension');
        return fusionOrder;
    }
    build() {
        return this.inner.build();
    }
    getOrderHash(chainId) {
        return this.inner.getOrderHash(chainId);
    }
    getTypedData(chainId) {
        return this.inner.getTypedData(chainId);
    }
    getCalculator() {
        return AuctionCalculator.fromAuctionData(this.fusionExtension.auctionDetails);
    }
    calcTakingAmount(taker, makingAmount, time, blockBaseFee = 0n) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return this.getAmountCalculator().getRequiredTakingAmount(taker, takingAmount, time, blockBaseFee);
    }
    getUserReceiveAmount(taker, makingAmount, time, blockBaseFee = 0n) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return this.getAmountCalculator().getUserTakingAmount(taker, makingAmount, takingAmount, this.makingAmount, time, blockBaseFee);
    }
    getSurplusFee(taker, makingAmount, time, blockBaseFee = 0n) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return this.getAmountCalculator().getSurplusFee(taker, makingAmount, takingAmount, this.makingAmount, time, blockBaseFee);
    }
    getResolverFee(taker, time, blockBaseFee = 0n, makingAmount = this.makingAmount) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return (this.getAmountCalculator().getResolverFee(taker, takingAmount, time, blockBaseFee) ?? 0n);
    }
    getIntegratorFee(taker, time, blockBaseFee = 0n, makingAmount = this.makingAmount) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return (this.getAmountCalculator().getIntegratorFee(taker, takingAmount, time, blockBaseFee) ?? 0n);
    }
    getProtocolShareOfIntegratorFee(taker, time, blockBaseFee = 0n, makingAmount = this.makingAmount) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return (this.getAmountCalculator().getProtocolShareOfIntegratorFee(taker, takingAmount, time, blockBaseFee) ?? 0n);
    }
    getProtocolFee(taker, time, blockBaseFee = 0n, makingAmount = this.makingAmount) {
        const takingAmount = calcTakingAmount(makingAmount, this.makingAmount, this.takingAmount);
        return (this.getAmountCalculator().getProtocolFee(taker, takingAmount, time, blockBaseFee) ?? 0n);
    }
    canExecuteAt(executor, executionTime) {
        return this.fusionExtension.whitelist.canExecuteAt(executor, executionTime);
    }
    isExpiredAt(time) {
        return time > this.deadline;
    }
    isExclusiveResolver(wallet) {
        return this.fusionExtension.whitelist.isExclusiveResolver(wallet);
    }
    isExclusivityPeriod(time = now()) {
        return this.fusionExtension.whitelist.isExclusivityPeriod(time);
    }
    getAmountCalculator() {
        return AmountCalculator.fromExtension(this.fusionExtension);
    }
}
FusionOrder.defaultExtra = {
    allowPartialFills: true,
    allowMultipleFills: true,
    unwrapWETH: false,
    enablePermit2: false,
    orderExpirationDelay: 12n
};
//# sourceMappingURL=fusion-order.js.map