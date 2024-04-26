import { keccak256, toHex } from 'viem';
import { Utils } from "@gribi/vault";


export const MODULE_ID = BigInt(keccak256(toHex("example-module")));

export type Commitment = string;
export type Salt = bigint;
export type Proof = string;
export type Secret = string;

interface CommitUpdateRevealContractInterface {
    commit(commitment: Commitment, proof: Proof): void;
    update(commitment: Commitment, proof: Proof, nullifier: Commitment): void;
    reveal(commitment: Commitment, salt: Salt, secret: Secret): void;
}




interface Prover {
    (secret: Secret, salt: Salt): Promise<Proof>;
}
export type Witness = {
    salt: Salt;
    secret: Secret;
}

export type FullProof = {
    commitment: Commitment;
    witness: Witness
    proof: Proof;
}

export type CommitState = {
    salt: Salt;
    secret: Secret;
    proof: Proof;
    commitment: Commitment;
    nullifier?: Commitment;
}

export interface WitnessStore {
    get(commitment: Commitment): Witness;
    set(commitment: Commitment, witness: Witness): void;
    clear(commitment: Commitment): void;
}


export interface SaltGenerator {
    (): bigint;
}
export interface CommitUpdateRevealInterface {
    contracts: CommitUpdateRevealContractInterface;
    prover: Prover;
    witnesses: WitnessStore;
    saltGenerator: SaltGenerator;
    commit(secret: Secret): Promise<CommitState>;
    update(secret: string, nullifier: string): Promise<CommitState>;
    reveal(commitment: string): Promise<void>;
}

const rng = (): bigint => Utils.rng() as bigint;

export class CommitUpdateReveal {
    contracts: CommitUpdateRevealContractInterface;
    prover: Prover;
    witnesses: WitnessStore;
    saltGenerator = rng;
    constructor(contracts: CommitUpdateRevealContractInterface, witnesses: WitnessStore, prover: Prover) {
        this.contracts = contracts
        this.prover = prover;
        this.witnesses = witnesses;
    }

    async createCommitment(secret: Secret, salt: Salt): Promise<Commitment> {

        return (await Utils.keccak([salt, BigInt(secret)])).toString();
    }

    async extractProof(secret: Secret): Promise<FullProof> {
        const salt = this.saltGenerator();
        const commitment = await this.createCommitment(secret, salt);
        const proof = await this.prover(secret, salt);
        return {
            commitment,
            witness: { salt, secret },
            proof
        }
    }

    async commit(secret: Secret): Promise<CommitState> {
        const { commitment, proof, witness: { salt } } = await this.extractProof(secret);
        this.contracts.commit(commitment, proof);
        this.witnesses.set(commitment, { salt, secret });
        return { salt, secret, proof, commitment };
    }

    async update(secret: string, nullifier: string): Promise<CommitState> {
        const { commitment, proof, witness: { salt } } = await this.extractProof(secret);
        this.contracts.update(commitment, proof, nullifier);
        this.witnesses.set(commitment, { salt, secret });
        return { salt, secret, proof, commitment, nullifier };
    }
    async reveal(commitment: string): Promise<void> {
        const { salt, secret } = this.witnesses.get(commitment);
        this.contracts.reveal(commitment, salt, secret);
    }
}


CommitUpdateReveal