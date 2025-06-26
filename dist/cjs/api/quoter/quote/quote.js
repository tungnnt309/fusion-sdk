"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quote = void 0;
const limit_order_sdk_1 = require("@1inch/limit-order-sdk");
const byte_utils_1 = require("@1inch/byte-utils");
const order_params_1 = require("./order-params");
const types_1 = require("../types");
const preset_1 = require("../preset");
const fusion_order_1 = require("../../../fusion-order");
const constants_1 = require("../../../fusion-order/constants");
const fees_1 = require("../../../fusion-order/fees");
class Quote {
    constructor(params, response) {
        this.params = params;
        this.fromTokenAmount = BigInt(response.fromTokenAmount);
        this.presets = {
            [types_1.PresetEnum.fast]: new preset_1.Preset(response.presets.fast),
            [types_1.PresetEnum.medium]: new preset_1.Preset(response.presets.medium),
            [types_1.PresetEnum.slow]: new preset_1.Preset(response.presets.slow),
            [types_1.PresetEnum.custom]: response.presets.custom
                ? new preset_1.Preset(response.presets.custom)
                : undefined
        };
        this.toTokenAmount = response.toTokenAmount;
        this.marketReturn = BigInt(response.marketAmount);
        this.prices = response.prices;
        this.volume = response.volume;
        this.quoteId = response.quoteId;
        this.whitelist = response.whitelist.map((a) => new limit_order_sdk_1.Address(a));
        this.recommendedPreset = response.recommended_preset;
        this.slippage = response.autoK;
        this.settlementAddress = new limit_order_sdk_1.Address(response.settlementAddress);
        this.resolverFeePreset = {
            receiver: new limit_order_sdk_1.Address(response.fee.receiver),
            whitelistDiscountPercent: limit_order_sdk_1.Bps.fromPercent(response.fee.whitelistDiscountPercent),
            bps: new limit_order_sdk_1.Bps(BigInt(response.fee.bps))
        };
        this.surplusFee = response.surplusFee;
    }
    createFusionOrder(paramsData) {
        const params = order_params_1.FusionOrderParams.new({
            preset: paramsData?.preset || this.recommendedPreset,
            receiver: paramsData?.receiver,
            permit: this.params.permit,
            isPermit2: this.params.isPermit2,
            nonce: paramsData?.nonce,
            network: paramsData.network
        });
        const preset = this.getPreset(params.preset);
        const auctionDetails = preset.createAuctionDetails(params.delayAuctionStartTimeBy);
        const allowPartialFills = paramsData?.allowPartialFills ?? preset.allowPartialFills;
        const allowMultipleFills = paramsData?.allowMultipleFills ?? preset.allowMultipleFills;
        const isNonceRequired = !allowPartialFills || !allowMultipleFills;
        const nonce = isNonceRequired
            ? (params.nonce ?? (0, limit_order_sdk_1.randBigInt)(byte_utils_1.UINT_40_MAX))
            : params.nonce;
        const takerAsset = this.params.toTokenAddress.isNative()
            ? constants_1.CHAIN_TO_WRAPPER[paramsData.network]
            : this.params.toTokenAddress;
        return fusion_order_1.FusionOrder.new(this.settlementAddress, {
            makerAsset: this.params.fromTokenAddress,
            takerAsset: takerAsset,
            makingAmount: this.fromTokenAmount,
            takingAmount: preset.auctionEndAmount,
            maker: this.params.walletAddress,
            receiver: params.receiver
        }, {
            auction: auctionDetails,
            whitelist: this.getWhitelist(auctionDetails.startTime, preset.exclusiveResolver),
            surplus: new fusion_order_1.SurplusParams(this.marketReturn, limit_order_sdk_1.Bps.fromPercent(this.surplusFee || 0))
        }, {
            nonce,
            unwrapWETH: this.params.toTokenAddress.isNative(),
            permit: params.permit,
            allowPartialFills,
            allowMultipleFills,
            orderExpirationDelay: paramsData?.orderExpirationDelay,
            source: this.params.source,
            enablePermit2: params.isPermit2,
            fees: buildFees(this.resolverFeePreset, this.params.integratorFee, this.surplusFee)
        });
    }
    getPreset(type = types_1.PresetEnum.fast) {
        return this.presets[type];
    }
    getWhitelist(auctionStartTime, exclusiveResolver) {
        if (exclusiveResolver) {
            return fusion_order_1.Whitelist.fromNow(this.whitelist.map((resolver) => {
                const isExclusive = resolver.equal(exclusiveResolver);
                return {
                    address: resolver,
                    allowFrom: isExclusive ? 0n : auctionStartTime
                };
            }));
        }
        return fusion_order_1.Whitelist.fromNow(this.whitelist.map((resolver) => ({
            address: resolver,
            allowFrom: 0n
        })));
    }
}
exports.Quote = Quote;
function buildFees(resolverFeePreset, integratorFee, surplusFee) {
    const protocolReceiver = resolverFeePreset.receiver;
    const hasIntegratorFee = integratorFee && !integratorFee.value.isZero();
    const hasProtocolFee = !resolverFeePreset.bps.isZero() || (surplusFee || 0) > 0;
    if (!hasProtocolFee && !hasIntegratorFee) {
        return undefined;
    }
    return new fees_1.Fees(new fees_1.ResolverFee(protocolReceiver, resolverFeePreset.bps, resolverFeePreset.whitelistDiscountPercent), integratorFee
        ? new fees_1.IntegratorFee(integratorFee.receiver, protocolReceiver, integratorFee.value, integratorFee.share)
        : fees_1.IntegratorFee.ZERO);
}
//# sourceMappingURL=quote.js.map