import { Address, Extension, Interaction } from '@1inch/limit-order-sdk';
import { AuctionDetails } from './auction-details';
import { Whitelist } from './whitelist/whitelist';
import { SurplusParams } from './surplus-params';
import { Fees } from './fees';
export declare class FusionExtension {
    readonly address: Address;
    readonly auctionDetails: AuctionDetails;
    readonly whitelist: Whitelist;
    readonly surplus: SurplusParams;
    readonly extra?: {
        makerPermit?: Interaction;
        customReceiver?: Address;
        fees?: Fees;
    } | undefined;
    private static CUSTOM_RECEIVER_FLAG_BIT;
    constructor(address: Address, auctionDetails: AuctionDetails, whitelist: Whitelist, surplus: SurplusParams, extra?: {
        makerPermit?: Interaction;
        customReceiver?: Address;
        fees?: Fees;
    } | undefined);
    static decode(bytes: string): FusionExtension;
    static fromExtension(extension: Extension): FusionExtension;
    build(): Extension;
    private buildInteractionData;
    private buildAmountGetterData;
    private getFeesForTaker;
    private getTakingAmountWithFee;
}
