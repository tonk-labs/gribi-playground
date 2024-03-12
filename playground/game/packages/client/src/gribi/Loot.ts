import { Vault, Module, NetworkCall, Forest, Utils, Gribi, KernelCircuit, PrivateEntry, PublicInput, Operation, Proof, Transaction } from 'gribi-js';
import ClaimLoot from '../circuits/claimLoot/target/claimLoot.json';
import RevealLoot from '../circuits/revealLoot/target/revealLoot.json';


type Field = number | string;

type OperationData = {
    commitment: Field,
    nullifier?: Field 
}

type OperationPackage = {
    entries: PrivateEntry[],
    data: Operation[],
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


//user needs to fetch the state trees
//user calls the fn with relevant params
//fn returns with private stuff, Operation data
//private stuff goes into vault, Operation data goes into circuit with state trees (all circuits expect the trees)
//Operation data and proof goes to gribi (trees are popped in by verifier as well)
//system fn calls gribi with Operation data and proof and then updates the state accordingly
//client picks up changes to trees

//we could basically specify that any public state variables need to included as public inputs to the circuit
//then in the calldata we give the solidity contract the necessary information it needs to find that data (we just hash it)

//so then the operation goes like...
//pub inputs (slot, value) which is hashed with users address and merkle proof down on chain
//pub operations (what we already have)
//inf witnesses

const TREASURE_ID = "treasure-module";

export type ModuleCalls = ReturnType<typeof createModuleCalls>;

export function createModuleCalls(call: NetworkCall) {
    const openTreasureBox = async (treasureBoxTypeID: number, instanceID: PublicInput) => {
        const randomness = Math.random();
        const salt = Math.random() * 1000000000;
        const commitment = await Utils.pedersenHash([BigInt(treasureBoxTypeID), BigInt(instanceID.value), BigInt(randomness), BigInt(salt)]);
        const boxKey: PrivateEntry = {
            commitment: commitment.toString(),
            slot: 1,
            value: {
                randomness,
                salt,
                treasureBoxTypeID,
                instanceID
            }
        };
        const data = [{
            type: 0,
            value: commitment,
            slot: 1,
        }];

        //TODO: we can generate ABI for this eventually
        const tx = await Gribi.createGribiTx(
            TREASURE_ID,
            //TODO: eventually Gribi should generate this
            "openBox", //this could be hash of method signature, but it determines which fn receives input for this tx
            [instanceID],
            data
        )
        // make the network call
        await call(tx);
        Vault.setEntry(Gribi.walletAddress, TREASURE_ID, boxKey);
    }




    //TODO:
    //public randomness needs to be in public tree, treasureItems 
    const claimTreasure = async (publicRandomness: number, boxKey: BoxEntry): Promise<OperationPackage[]> => {
        const joinedRandomness = Utils.pedersenHash([publicRandomness, boxKey.value.randomness]); //we just take lower bits
        //determine the index into the tresure array
        const treasureItemIndex = 20;
        const salt = Math.random() * 10000000000;
        const commitment = Utils.pedersenHash([treasureItemIndex, joinedRandomness, salt]);
        const treasure = {
            __id: String(commitment),
            commitment: commitment,
            //TODO:
            slot: 2, //player might have lots of secret treasure, so you kind of wanna "update a data structure" not just outright overwrite it
            value: {
                joinedRandomness,
                salt,
                treasureItemIndex
            }
        };

        //two Operations
        //means this logic needs to somehow describe where the relevant state lives on the state tree 
        //commit Operation for treasure (prove the commitment computed right and nullifier is just commitment)
        //nullify the old commit (prove this was computed right) — prove the hash

        const Operation = {
            data: {
                commitment, //new commitment to the item
            },
            //we can check in here the proof that the nullifier is formed correctly and that should be enough
            nullifier: Utils.pedersenHash(boxKey.commitment, boxKey.value.instanceID) //old commitment nullifier to the randomness commitment
        }
        
        return [{
            entries: [treasure],
            data: [{
                type: 0,
                slot: 2,
                value: commitment,
            }, {
                type: 0,
                nullifier: Operation.nullifier,
            }]
        }]

        const proof = Gribi.prove(ClaimLoot, {
            //we're going to inject in here the public commitment on the contract side when we double-check the proof
            public_context: {
                namespace: Utils.namespaceHash("Loot"),
            }, 
            private_context: {
                player_storage: [
                    joinedRandomness, salt, treasureItemIndex
                ]
            },
            Operation,
        });

        Vault.store(treasure).onCondition(
            Gribi.send({
                route: { namespace: "Loot", fn: "claimLoot" },
                proof,
            Operation 
            }));
    }

    const revealTreasure = async (treasure: TreasureEntry) => {
        const proof = Gribi.prove(RevealLoot, {
            //the public context here needs to include the commitment to the treasure and also the opening
            public_context: {
                player_storage: [treasure.value.treasureItemIndex],
            }, 
            private_context: {

            },
            Operation: {
                nullifier: Utils.pedersenHash([treasure.commitment, Vault.walletAddress])
            },
        });
        Vault.remove(treasure).onCondition(
            Gribi.send
        )
    }

    return {
        openTreasureBox,
        claimTreasure,
        revealTreasure,
    }
}