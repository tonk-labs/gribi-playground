import { keccak256, toHex } from 'viem';
import { 
    Signal, 
    Field,
    Receptor,
} from '@gribi/types';
import { WitnessRelation, Precursor } from '@gribi/types';
import { Utils } from "@gribi/vault";
import { EVMRootSystem, StateUpdate, prove, NoirCircuit } from "@gribi/evm-rootsystem";

import CommitCheck from '../../circuits/commit/target/commit.json';

export const MODULE_ID = BigInt(keccak256(toHex("example-module")));

export type Commitment = string;
export type CommitmentArgs = {
    secret: Field,
    salt: Field,
}

export type StoredCommitment = {
    secret: string[],
    salt: string[],
}

export type UpdateCommitmentArgs = {
    relation: WitnessRelation<Commitment[], StoredCommitment>,
    circuit?: NoirCircuit,
    secret: Field,
    salt: Field,
}

export class CreateCommitment implements Precursor<CommitmentArgs, Commitment[], StoredCommitment> {
    async bond(args: CommitmentArgs): Promise<WitnessRelation<Commitment[], StoredCommitment>> {
        const commitment = (await Utils.pedersenHash([args.secret as bigint, args.salt as bigint])).toString();
        return {
            claim: [commitment.toString()],
            witness: {
                secret: [args.secret.toString()],
                salt: [args.salt.toString()]
            }
        }
    }
}

export class UpdateCommitment implements Precursor<UpdateCommitmentArgs, Commitment[], StoredCommitment> {
    async bond(args: UpdateCommitmentArgs): Promise<WitnessRelation<Commitment[], StoredCommitment>> {
        const commitment = (await Utils.pedersenHash([args.secret as bigint, args.salt as bigint])).toString();
        return {
            claim: [args.relation.claim.slice(-1)[0], commitment],
            witness: {
                secret: [args.relation.witness.secret.slice(-1)[0], args.secret.toString()],
                salt: [args.relation.witness.salt.slice(-1)[0], args.salt.toString()]
            }
        }
    }
}

export class CreateCommitmentReceptor implements Receptor<WitnessRelation<Commitment[], StoredCommitment>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment[], StoredCommitment>): Promise<Signal<StateUpdate>> {
        let cc = CommitCheck as NoirCircuit;
        const inputs =  [Utils.EmptyInput()];
        const operations = [{
            opid: toHex(0),
            value: toHex(BigInt(args.claim.slice(-1)[0])),
            nullifier: toHex(0),
        }];

        // Disabling because of build errors
        const proof = await prove(EVMRootSystem.walletAddress, cc, [], operations, {
            commitment: toHex(BigInt(args.claim.slice(-1)[0])),
            secret: toHex(BigInt(args.witness.secret.slice(-1)[0].toString())),
            salt: toHex(BigInt(args.witness.salt.slice(-1)[0].toString()))
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
        // let cc = CommitCheck as CompiledCircuit;
        const inputs = [Utils.EmptyInput()];
        const operations = [
            {
                opid: 0,
                value: BigInt(args.relation.claim[1]),
                nullifier: BigInt(args.relation.claim[0]),
            },
        ];

        // Disabling because of build errors
        // const proof = await prove(EVMRootSystem.walletAddress, args.circuit || cc, inputs, operations, {
        //     secret: args.secret.toString(),
        //     salt: args.salt.toString()
        // })

        return {
            output: {
                id: MODULE_ID,
                method: 'updateCommitment',
                inputs,
                operations,
                // proof
            }
        }
    }
}

export class RevealCommitment implements Receptor<WitnessRelation<Commitment[], StoredCommitment>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment[], StoredCommitment>): Promise<Signal<StateUpdate>> {
        const commitment = args.claim.slice(-1)[0];
        const secret = args.witness.secret.slice(-1)[0];
        const salt = args.witness.salt.slice(-1)[0];
        return {
            output: {
                id: MODULE_ID,
                method: "revealCommitment",
                inputs: [{
                    slot: 0,
                    value: commitment
                }, {
                    slot: 0,
                    value: BigInt(salt)
                }, {
                    slot: 0,
                    value: BigInt(secret)
                }],
                operations: [{
                    opid: 0,
                    nullifier: commitment
                }]
            }
        }
    }
}