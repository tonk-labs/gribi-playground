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

export class UpdateCommitment implements Precursor<UpdateCommitmentArgs, Commitment[], StoredCommitment> {
    async bond(args: UpdateCommitmentArgs): Promise<WitnessRelation<Commitment[], StoredCommitment>> {
        const commitment = (await Utils.pedersenHash([args.salt as bigint, args.secret as bigint])).toString();
        return {
            claim: [args.relation.claim.pop()!, commitment],
            witness: {
                secret: [args.relation.witness.secret.pop()!, args.secret],
                salt: [args.relation.witness.salt.pop()!, args.salt]
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
            value: BigInt(args.claim.pop()!),
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

export class UpdateCommitmentReceptor implements Receptor<UpdateCommitmentArgs, StateUpdate> {
    async signal(args: UpdateCommitmentArgs): Promise<Signal<StateUpdate>> {
        let cc = CommitCheck as CompiledCircuit;
        const inputs = [Utils.EmptyInput()];
        const operations = [
            {
                opid: 0,
                value: BigInt(args.relation.claim[1]),
                nullifier: BigInt(args.relation.claim[0]),
            },
        ];
        const proof = await prove(EVMRootSystem.walletAddress, args.circuit || cc, inputs, operations, {
            secret: args.secret.toString(),
            salt: args.salt.toString()
        })

        return {
            output: {
                id: MODULE_ID,
                method: 'updateCommitment',
                inputs,
                operations,
                proof
            }
        }
    }
}

export class RevealCommitment implements Receptor<WitnessRelation<Commitment[], StoredCommitment>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment[], StoredCommitment>): Promise<Signal<StateUpdate>> {
        const commitment = args.claim.pop()!;
        const secret = args.witness.secret.pop()!;
        const salt = args.witness.salt.pop()!;
        return {
            output: {
                id: MODULE_ID,
                method: "revealCommitment",
                inputs: [{
                    slot: 0,
                    value: commitment
                }, {
                    slot: 0,
                    value: salt
                }, {
                    slot: 0,
                    value: secret
                }],
                operations: [{
                    opid: 0,
                    nullifier: commitment
                }]
            }
        }
    }
}