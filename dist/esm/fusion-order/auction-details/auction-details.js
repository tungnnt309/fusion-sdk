import { ethers } from 'ethers';
import { BytesBuilder, BytesIter } from '@1inch/byte-utils';
import assert from 'assert';
import { isHexBytes } from '../../validations';
import { add0x, trim0x } from '../../utils';
import { UINT_24_MAX, UINT_32_MAX } from '../../constants';
export class AuctionDetails {
    constructor(auction) {
        this.startTime = BigInt(auction.startTime);
        this.initialRateBump = BigInt(auction.initialRateBump);
        this.duration = auction.duration;
        this.points = auction.points;
        this.gasCost = auction.gasCost || {
            gasBumpEstimate: 0n,
            gasPriceEstimate: 0n
        };
        assert(this.gasCost.gasBumpEstimate <= UINT_24_MAX);
        assert(this.gasCost.gasPriceEstimate <= UINT_32_MAX);
        assert(this.startTime <= UINT_32_MAX);
        assert(this.duration <= UINT_24_MAX);
        assert(this.initialRateBump <= UINT_24_MAX);
    }
    static decodeFrom(iter) {
        const gasBumpEstimate = iter.nextUint24();
        const gasPriceEstimate = iter.nextUint32();
        const start = iter.nextUint32();
        const duration = iter.nextUint24();
        const rateBump = Number(iter.nextUint24());
        const points = [];
        let pointsLen = BigInt(iter.nextUint8());
        while (pointsLen--) {
            points.push({
                coefficient: Number(iter.nextUint24()),
                delay: Number(iter.nextUint16())
            });
        }
        return new AuctionDetails({
            startTime: BigInt(start),
            duration: BigInt(duration),
            initialRateBump: rateBump,
            points,
            gasCost: {
                gasBumpEstimate: BigInt(gasBumpEstimate),
                gasPriceEstimate: BigInt(gasPriceEstimate)
            }
        });
    }
    static decode(data) {
        assert(isHexBytes(data), 'Invalid auction details data');
        const iter = BytesIter.BigInt(data);
        return AuctionDetails.decodeFrom(iter);
    }
    static fromExtension(extension) {
        return AuctionDetails.decode(add0x(extension.makingAmountData.slice(42)));
    }
    encode() {
        let details = ethers.solidityPacked(['uint24', 'uint32', 'uint32', 'uint24', 'uint24', 'uint8'], [
            this.gasCost.gasBumpEstimate,
            this.gasCost.gasPriceEstimate,
            this.startTime,
            this.duration,
            this.initialRateBump,
            this.points.length
        ]);
        for (let i = 0; i < this.points.length; i++) {
            details += trim0x(ethers.solidityPacked(['uint24', 'uint16'], [this.points[i].coefficient, this.points[i].delay]));
        }
        return details;
    }
    encodeInto(builder = new BytesBuilder()) {
        return builder.addBytes(this.encode());
    }
}
//# sourceMappingURL=auction-details.js.map