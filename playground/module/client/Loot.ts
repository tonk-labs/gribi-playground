import { Vault, Gribi, Utils } from 'gribi-js';
import ClaimLoot from './circuits'

export type PrivateEntry = {
    __id: string,
    commitment: Field,
    nonce?: number, 
    value: any,
}

type Field = number | string;

type PrivateData = {
    variables: PrivateEntry[], 
    commitments: Record<string, PrivateEntry>
}

type TransactionData = {
    commitment: Field,
    nullifier?: Field 
}

type Transaction = {
    data: TransactionData,
    seffect: Storage,
    nullifier: Field 
}

type Storage = {
    pageOffset: Field,
    slot: Field,
    value: Field
}

type BoxValue = {
    randomness: number,
    salt: number,
    treasureBoxTypeID: number,
    instanceID: number,
}

interface BoxEntry extends PrivateEntry {
    value: BoxValue
}

type TreasureValue = {
    joinedRandomness: number,
    salt: number,
    treasureItemIndex: number,
}

interface TreasureEntry extends PrivateEntry {
    value: TreasureValue
}

export const openTreasureBox = async (treasureBoxTypeID: number, instanceID: number) => {
    const randomness = Math.random();
    const salt = Math.random() * 1000000000;
    const commitment = Utils.pedersenHash([treasureBoxTypeID, instanceID, randomness, salt]);
    const boxKey = {
        __id: String(commitment),
        commitment: commitment,
        value: {
            randomness,
            salt,
            treasureBoxTypeID,
            instanceID
        }
    };
    // this is kinda weird actually, because we need some way to guarantee the nullifier is computed correctly to avoid abuse actually :( — we can just do it contract side —f it
    Vault.store(boxKey).onCondition(
        Gribi.sendWithoutProof({
            route: { namespace: "Loot", fn: "openBox" },
            data: {
                commitment: boxKey.commitment,
            }
    }));
}

export const claimTreasure = async (publicRandomness: number, boxKey: BoxEntry) => {
    const joinedRandomness = Utils.pedersenHash([publicRandomness, boxKey.value.randomness]); //we just take lower bits
    //determine the index into the tresure array
    const treasureItemIndex = 20;
    const salt = Math.random() * 10000000000;
    const commitment = Utils.pedersenHash([treasureItemIndex, joinedRandomness, salt]);
    const treasure = {
        __id: String(commitment),
        commitment: commitment,
        value: {
            joinedRandomness,
            salt,
            treasureItemIndex
        }
    };

    const transaction = {
        data: {
            commitment,
            nullifier: Utils.pedersenHash(commitment, Vault.walletAddress)
        },
        nullifier: Utils.pedersenHash(boxKey.commitment, 
    }

    const proof = Gribi.prove(claimLoot, {
        public_context: {...},
        private_context: {...},
        transaction,
    });

    Vault.store(treasure).onCondition(
        Gribi.send({
            route: { namespace: "Loot", fn: "claimLoot" },
            proof,
            transaction
        }));
}

export const revealTreasure = async (treasure: TreasureEntry) => {
    Vault.remove(treasure).onCondition(
        Gribi.send
    )
}