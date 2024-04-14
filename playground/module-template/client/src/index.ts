import { keccak256, toHex } from 'viem';
import { 
    Signal, 
    Field,
    Receptor,
} from '@gribi/types';
import { WitnessRelation, Precursor } from '@gribi/types';
import { Utils } from "@gribi/vault";
import { EVMRootSystem, StateUpdate, prove } from "@gribi/evm-rootsystem";
import { CompiledCircuit } from '@noir-lang/backend_barretenberg';

import CommitCheck from '../../circuits/commit/target/commit.json';

export const MODULE_ID = BigInt(keccak256(toHex("example-module")));

export type Commitment = string;
export type CommitmentArgs = {
    secret: Field,
    salt: Field,
}

export type StoredCommitment = {
    secret: Field[],
    salt: Field[],
}

export type UpdateCommitmentArgs = {
    relation: WitnessRelation<Commitment[], StoredCommitment>,
    circuit?: CompiledCircuit,
    secret: Field,
    salt: Field,
}

/**
 * Example code, delete and add your own
 */

export class CreateCommitment implements Precursor<CommitmentArgs, Commitment[], StoredCommitment> {
    async bond(args: CommitmentArgs): Promise<WitnessRelation<Commitment[], StoredCommitment>> {
        const commitment = (await Utils.pedersenHash([args.salt as bigint, args.secret as bigint])).toString();
        return {
            claim: [commitment.toString()],
            witness: {
                secret: [args.secret],
                salt: [args.salt]
            }
        }
    }
}

export class CreateCommitmentReceptor implements Receptor<WitnessRelation<Commitment[], StoredCommitment>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment[], StoredCommitment>): Promise<Signal<StateUpdate>> {
        let cc = CommitCheck as CompiledCircuit;
        const inputs =  [Utils.EmptyInput()];
        const operations = [{
            opid: 0,
            value: BigInt(args.claim.slice(-1)[0]),
        }];
        const proof = await prove(EVMRootSystem.walletAddress, cc, inputs, operations, {
            secret: args.witness.secret.toString(),
            salt: args.witness.salt.toString()
        });

        return {
            output: {
                id: MODULE_ID,
                method: 'createCommitment',
                inputs,
                operations,
                proof
            }
        }
    }
}