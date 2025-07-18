import { Address } from '@1inch/limit-order-sdk';
import { ResolverFee } from './resolver-fee';
import { IntegratorFee } from './integrator-fee';
export declare class Fees {
    readonly resolver: ResolverFee;
    readonly integrator: IntegratorFee;
    static BASE_1E5: bigint;
    static BASE_1E2: bigint;
    constructor(resolver: ResolverFee, integrator: IntegratorFee);
    get protocol(): Address;
    static resolverFee(fee: ResolverFee): Fees;
    static integratorFee(fee: IntegratorFee): Fees;
}
