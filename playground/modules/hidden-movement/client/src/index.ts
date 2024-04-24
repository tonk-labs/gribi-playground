import { keccak256, toHex } from 'viem';
import {
    Signal,
    Field,
    Receptor,
    PublicInput,
    WitnessRelation,
    Precursor,
    Operation,
    ProofData,
} from '@gribi/types';
import { Utils } from "@gribi/vault";
import { EVMRootSystem, StateUpdate, prove } from "@gribi/evm-rootsystem";
import { CompiledCircuit } from '@noir-lang/backend_barretenberg';
import { Commitment, CreateCommitment, CommitmentArgs, StoredCommitment, UpdateCommitmentArgs } from '../../../commit-update-reveal/client/src/index';
// import CommitCheck from '../../circuits/commit/target/commit.json';

export const MODULE_ID = BigInt(keccak256(toHex("hidden-movement")));


export type Witness = {
    position: Position,
    salt: bigint,
}

export type StateUpdateWithWitnessRelation = {
    stateUpdate: StateUpdate,
    witnessRelation: WitnessRelation<Commitment, Witness>
};

export class Position {
    x: bigint;
    y: bigint;
    constructor(x: bigint, y: bigint) { this.x = x; this.y = y; }
    toBigInt() {
        return this.x << 128n | (this.y & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn);
    }
}

export type PositionUpdate = {
    currentPosition: Position,
    currentClaim: Commitment,
    circuit?: CompiledCircuit,
    newPosition: Position,
}





export class HideMovementReceptor implements Receptor<UpdateCommitmentArgs, StateUpdateWithWitnessRelation> {
    async signal(position: Position): Promise<Signal<StateUpdateWithWitnessRelation>> {
        // let cc = CommitCheck as CompiledCircuit;

        const salt = Utils.rng() as bigint;
        const positionBigInt = position.toBigInt();
        const commitment = (await Utils.keccak([salt, positionBigInt])).toString();

        const witnessRelation = {
            claim: commitment,
            witness: {
                position: position,
                salt: salt,
            }
        }
        const operations = [{
            opid: 0,
            value: commitment,
        }];

        // Disabling because of build errors
        // const proof = await prove(EVMRootSystem.walletAddress, cc, inputs, operations, {
        //     secret: args.witness.secret.toString(),
        //     salt: args.witness.salt.toString()
        // });

        return {
            output: {
                stateUpdate: {
                    id: MODULE_ID,
                    method: 'createCommitment',
                    inputs: [Utils.EmptyInput()],
                    operations,
                    // proof,
                },
                witnessRelation,
            }
        }
    }
}
export class UpdatePositionReceptor implements Receptor<UpdateCommitmentArgs, StateUpdateWithWitnessRelation> {
    async signal(args: PositionUpdate): Promise<Signal<StateUpdateWithWitnessRelation>> {
        // let cc = CommitCheck as CompiledCircuit;
        const { currentPosition, currentClaim, newPosition: newPosition } = args;
        const positionBigInt = newPosition.toBigInt();
        const salt = Utils.rng() as bigint;
        const commitment = (await Utils.keccak([salt, positionBigInt])).toString();

        const witnessRelation = {
            claim: commitment,
            witness: {
                position: newPosition,
                salt: salt,
            }
        }

        const operations = [
            {
                opid: 0,
                value: commitment,
                nullifier: currentClaim,
            },
        ];

        // Disabling because of build errors
        // const proof = await prove(EVMRootSystem.walletAddress, args.circuit || cc, inputs, operations, {
        //     secret: args.secret.toString(),
        //     salt: args.salt.toString()
        // })

        return {
            output: {
                stateUpdate: {
                    id: MODULE_ID,
                    method: 'updateCommitment',
                    inputs: [Utils.EmptyInput()],
                    operations,
                    // proof
                },
                witnessRelation,
            }
        }
    }
}




export class RevealPositionReceptor implements Receptor<WitnessRelation<Commitment, Witness>, StateUpdate> {
    async signal(args: WitnessRelation<Commitment, Witness>): Promise<Signal<StateUpdate>> {
        const { claim, witness: { salt, position } } = args;

        return {
            output: {
                id: MODULE_ID,
                method: "revealCommitment",
                inputs: [{
                    slot: 0,
                    value: claim
                }, {
                    slot: 0,
                    value: salt
                }, {
                    slot: 0,
                    value: position.toBigInt()
                }],
                operations: [{
                    opid: 0,
                    nullifier: claim
                }]
            }
        }
    }
}