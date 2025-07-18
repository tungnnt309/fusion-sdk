import { Address } from '@1inch/limit-order-sdk';
import { isValidAmount } from '../../validations';
export class QuoterRequest {
    constructor(params) {
        this.fromTokenAddress = new Address(params.fromTokenAddress);
        this.toTokenAddress = new Address(params.toTokenAddress);
        this.amount = params.amount;
        this.walletAddress = new Address(params.walletAddress);
        this.enableEstimate = params.enableEstimate || false;
        this.permit = params.permit;
        this.integratorFee = params.integratorFee;
        this.source = params.source || 'sdk';
        this.isPermit2 = params.isPermit2 ?? false;
        this.slippage = params.slippage;
        if (this.fromTokenAddress.isNative()) {
            throw new Error(`cannot swap ${Address.NATIVE_CURRENCY}: wrap native currency to it's wrapper fist`);
        }
        if (this.fromTokenAddress.isZero() || this.toTokenAddress.isZero()) {
            throw new Error(`replace ${Address.ZERO_ADDRESS} with ${Address.NATIVE_CURRENCY}`);
        }
        if (this.fromTokenAddress.equal(this.toTokenAddress)) {
            throw new Error('fromTokenAddress and toTokenAddress should be different');
        }
        if (!isValidAmount(this.amount)) {
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
//# sourceMappingURL=quoter.request.js.map