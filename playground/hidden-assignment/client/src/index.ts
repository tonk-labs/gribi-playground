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

import RandomnessCheck from '../../circuits/generate/target/generate.json';

export const MODULE_ID = BigInt(keccak256(toHex("hidden-assignment")));

export type Commitment = string;
export type JointRandomness = {
    myRandom: Field,
    chainRandom: Field
    commitmentKey: Field
}

export type StoredCommitment = {
    randomness: Field,
}

export type UpdateCommitmentArgs = {
    relation: WitnessRelation<Commitment[], StoredCommitment>,
    circuit?: CompiledCircuit,
    secret: Field,
    salt: Field,
}

export class CreateRandomness implements Precursor<undefined, Commitment, StoredCommitment> {
    async bond(args: undefined): Promise<WitnessRelation<Commitment, StoredCommitment>> {
        const randomness = Utils.rng() as bigint;
        const commitment = (await Utils.pedersenHash([randomness as bigint])).toString();
        return {
            claim: commitment.toString(),
            witness: {
                randomness, 
            }
        }
    }
}

export class RandomnessReceptor implements Receptor<WitnessRelation<Commitment, StoredCommitment>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment, StoredCommitment>): Promise<Signal<StateUpdate>> {
        let cc = RandomnessCheck as CompiledCircuit;
        const inputs =  [Utils.EmptyInput()];
        const operations = [{
            opid: 0,
            value: BigInt(args.claim),
        }];
        const proof = await prove(EVMRootSystem.walletAddress, cc, inputs, operations, {
            randomness: args.witness.randomness.toString()
        });

        return {
            output: {
                id: MODULE_ID,
                method: 'generate',
                inputs,
                operations,
                proof
            }
        }
    }
}

export class RevealCommitment implements Receptor<WitnessRelation<Commitment, JointRandomness>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment, JointRandomness>): Promise<Signal<StateUpdate>> {
        const commitment = args.claim;
        const index = (await Utils.pedersenHash([args.witness.myRandom as bigint, args.witness.chainRandom as bigint])).toString();

        //Generate proof for the reveal here

        return {
            output: {
                id: MODULE_ID,
                method: "reveal",
                inputs: [{
                    slot: args.witness.commitmentKey,
                    value: args.witness.chainRandom
                }],
                operations: [{
                    opid: 0,
                    value: index,
                    nullifier: commitment
                }]
            }
        }
    }
}