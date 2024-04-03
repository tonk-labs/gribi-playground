import { keccak256, toHex, encodePacked, hexToBigInt } from 'viem';
import { 
    PCD, 
    PCDURI,
    Signal, 
    PCDModule, 
    PCDPackage, 
    Field,
    SerializedPCD, 
    Receptor,
} from '@gribi/types';
import { ProofData } from "@noir-lang/types";
import { Utils, PrivateEntry } from "@gribi/vault";
import { StateUpdate, generateProof } from "@gribi/evm-rootsystem";
import { CompiledCircuit } from '@noir-lang/backend_barretenberg';

import CommitCheck from '../../circuits/commit/target/commit.json';

const MODULE_ID = BigInt(keccak256(toHex("example-module"))).toString();
const TYPES = {
    CREATE_COMMITMENT: "create-commitment",
    UPDATE_COMMITMENT: "update-commitment"
}

export type Commitment = string;
export type CommitmentUpdate = {
    prev: Commitment,
    updated: Commitment
}
export type ProperlyCommittedProof = {
    data?: ProofData 
}
export type CommitmentArgs = {
    secret: Field,
    salt: Field,
}

export type StoredCommitment = {
    commitment: Field,
    secret: Field,
    salt: Field,
}

export type UpdateCommitmentArgs = {
    entry: PrivateEntry<StoredCommitment>,
    circuit: CompiledCircuit,
    secret: Field,
    salt: Field,
}

export class CommitRevealPackage implements PCDPackage {
    namespace = MODULE_ID
    module(type: string | undefined): Promise<PCDModule> {
        switch (type) {
            case TYPES.CREATE_COMMITMENT: {
                return new Promise(() => new CreateCommitmentModule());
            }
            case TYPES.UPDATE_COMMITMENT: {
                return new Promise(() => new UpdateCommitmentModule());
            }
            default: {
                throw new Error("This is not a valid type!");
            }
        }
    }
} 

export class CreateCommitmentModule implements PCDModule<Commitment, ProperlyCommittedProof, CommitmentArgs> {
    type = TYPES.CREATE_COMMITMENT
    async prove(args: CommitmentArgs): Promise<PCD<Commitment, ProperlyCommittedProof>> {
        const commitment = (await Utils.pedersenHash([args.salt as bigint, args.secret as bigint])).toString();
        let cc = CommitCheck as CompiledCircuit;
        const data = await generateProof(cc, {
            commitment: commitment,
            secret: args.secret.toString(),
            salt: args.salt.toString()
        });

        return {
            uri: new PCDURI(MODULE_ID, this.type, commitment),
            claim: commitment,
            proof: { data }
        }
    }

    async verify(pcd: PCD<Commitment, ProperlyCommittedProof>): Promise<boolean> {
        return true;
    }

    async serialize(pcd: PCD<string, ProperlyCommittedProof>): Promise<SerializedPCD<PCD<Commitment, ProperlyCommittedProof>>> {
        return {
            pcd: ""
        }
    }
    async deserialize(serialized: SerializedPCD<PCD<unknown, unknown>>): Promise<PCD<Commitment, ProperlyCommittedProof>> {
        return {
            uri: new PCDURI(MODULE_ID, this.type, ""),
            claim: "",
            proof: {
            }
        }
    }
}

export class UpdateCommitmentModule implements PCDModule<CommitmentUpdate, ProperlyCommittedProof, UpdateCommitmentArgs> {
    type = TYPES.UPDATE_COMMITMENT
    async prove(args: UpdateCommitmentArgs): Promise<PCD<CommitmentUpdate, ProperlyCommittedProof>> {
        const commitment = (await Utils.pedersenHash([args.salt as bigint, args.secret as bigint])).toString();
        const data = await generateProof(args.circuit, {
            old_commitment: args.entry.value.commitment.toString(),
            old_secret: args.entry.value.secret.toString(),
            old_salt: args.entry.value.salt.toString(), 
            new_secret: args.secret.toString(),
            new_salt: args.salt.toString()
        });

        return {
            uri: new PCDURI(MODULE_ID, this.type, commitment),
            claim: { prev: commitment, updated: commitment },
            proof: { data }
        }
    }

    async verify(pcd: PCD<CommitmentUpdate, ProperlyCommittedProof>): Promise<boolean> {
        return true;
    }

    async serialize(pcd: PCD<CommitmentUpdate, ProperlyCommittedProof>): Promise<SerializedPCD<PCD<CommitmentUpdate, ProperlyCommittedProof>>> {
        return {
            pcd: ""
        }
    }
    async deserialize(serialized: SerializedPCD<PCD<unknown, unknown>>): Promise<PCD<CommitmentUpdate, ProperlyCommittedProof>> {
        return {
            uri: new PCDURI(MODULE_ID, this.type, ""),
            claim: { prev: "", updated: ""},
            proof: {
            }
        }
    }
}

export class PublishNewCommitment implements Receptor<Commitment, ProperlyCommittedProof, StateUpdate> {
    signal(pcd: PCD<Commitment, ProperlyCommittedProof>): Signal<StateUpdate> {
        return {
            output: {
                id: hexToBigInt(toHex(keccak256(encodePacked(["string"], [pcd.uri.string])))),
                method: "createCommitment",
                inputs: [Utils.EmptyInput()],
                operations: [{
                    opid: 0,
                    value: BigInt(pcd.claim),
                }]
            }
        }
    }
}

export class PublishUpdateCommitment implements Receptor<CommitmentUpdate, ProperlyCommittedProof, StateUpdate> {
    signal(pcd: PCD<CommitmentUpdate, ProperlyCommittedProof>): Signal<StateUpdate> {
        return {
            output: {
                id: hexToBigInt(toHex(keccak256(encodePacked(["string"], [pcd.uri.string])))),
                method: "updateCommitment",
                inputs: [Utils.EmptyInput()],
                operations: [
                    {
                        opid: 0,
                        value: BigInt(pcd.claim.updated),
                        nullifier: BigInt(pcd.claim.prev),
                    },
                ]
            }
        }
    }
}

export const RevealCommitment = async (entry: PrivateEntry<StoredCommitment>): Promise<Signal<StateUpdate>> => {
    let cc = CommitCheck as CompiledCircuit;
    const data = await generateProof(cc, {
        commitment: entry.value.commitment.toString(),
        secret: entry.value.secret.toString(),
        salt: entry.value.salt.toString()
    });
    return {
        output: {
            id: hexToBigInt(toHex(keccak256(encodePacked(["string", "string"], [entry.pcd!.id, entry.value.commitment.toString()])))),
            method: "revealCommitment",
            inputs: [{
                slot: 0,
                value: entry.value.commitment
            }, {
                slot: 0,
                value: entry.value.salt
            }, {
                slot: 0,
                value: entry.value.secret
            }],
            operations: [{
                opid: 0,
                nullifier: entry.value.commitment
            }]
        }
    }
}