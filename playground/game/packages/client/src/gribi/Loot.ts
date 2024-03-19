import { Vault, Module, NetworkCall, Forest, Utils, Gribi, KernelCircuit, PrivateEntry, PublicInput, Operation, Proof, Transaction } from 'gribi-js';
import ClaimLoot from '../../../circuits/claimLoot/target/claimLoot.json';
import RevealLoot from '../../../circuits/revealLoot/target/revealLoot.json';


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
    treasureItem: number,
}

type TreasureMap = Record<number, number[]>

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
    //instanceID copied to public input slot by SystemCalls
    //treasureBoxTypeID stored in public state
    const openTreasureBox = async (treasureBoxTypeID: number, instanceID: PublicInput) => {
        const randomness = Math.random();
        const salt = Math.random() * 1000000000;
        // if we wanted to hide the player too (hide who was receiving the treasure) we'd need to make a proof of valid instanceID using
        // something like merkle inclusion proof potentially
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
            // I suppose if want to allow public writes from the Gribi side it makes sense
            opid: 0, //now that we send something specific to function, one wonders if this is necessary or not?
            value: commitment,
            slot: 1,
        }];

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


    //In order to get the publicRandomness, the most convenient thing to do would be to write it from the Gribi side and then
    //have whatever state framework "react" to it. In this way, we can have writes through MUD and copy writes to Gribi, or vice versa.
    //that probably allows for the most flexibility here.
    const claimTreasure = async (publicRandomness: PublicInput, instanceID: PublicInput, treasureMap: TreasureMap, boxKey: BoxEntry) => {
        const hash = await Utils.pedersenHash([BigInt(publicRandomness.value), BigInt(boxKey.value.randomness)]); 
        const joinedRandomness = hash & BigInt(100);
        //determine the index into the tresure array
        const treasureBoxId = boxKey.value.treasureBoxTypeID;
        //treasureBoxId would index into some kind of datastructure
        const treasureItems: number[] = treasureMap[treasureBoxId];
        const treasureItemsHash = BigInt(2301923); //let's pretend we hash the items
        const treasureItemIndex = Math.round(Number(joinedRandomness) * (100 / treasureItems.length - 1));
        const treasureItem = treasureItems[treasureItemIndex];
        const salt = Math.random() * 10000000000;
        const commitment = await Utils.pedersenHash([BigInt(boxKey.value.instanceID), BigInt(treasureItemIndex), joinedRandomness, BigInt(salt)]);
        const treasure = {
            commitment: commitment.toString(), //TODO: all these type conversions are ugly need to change that eventually...
            //TODO:
            slot: 2, //player might have lots of secret treasure, so you kind of wanna "update a data structure" not just outright overwrite it
            value: {
                joinedRandomness,
                salt,
                treasureItemIndex,
                boxKey: boxKey.value,
                treasureItem
            }
        };

        const data = [{
            opid: 0,
            slot: 2, //TODO: how to deal with array slots? 
            value: commitment,
        }, {
            opid: 0, 
            value: BigInt(boxKey.commitment),
            nullifier: BigInt(boxKey.commitment) //do we need to do anything more complex here?  
        }];

        //proof stuff happens here.. what's the API for creating proofs?
        // const kc = await (new KernelCircuit).init();
        // const proof = await kc.generateProof(
        //     // this treasureItem awkwardness basically comes from the fact that we need to somehow inject arbitrary public state into the circuits
        //     [publicRandomness, instanceID, { value: treasureItemsHash }],
        //     data,
        //     Gribi.roots(), //TODO: need a function call that will fetch the latest tree roots on chain
        //     ClaimLoot
        // );

        // we want the interface to work in such a way that 
        const tx = await Gribi.createGribiTx(
            TREASURE_ID,
            //TODO: eventually Gribi should generate this
            "claimTreasure", //this could be hash of method signature, but it determines which fn receives input for this tx
            [publicRandomness, instanceID, { value: treasureItemsHash, slot: 0 }],
            data,
            ClaimLoot
        )

        await call(tx);
        Vault.setEntry(Gribi.walletAddress, TREASURE_ID, treasure);
    }

    const revealTreasure = async (treasure: TreasureEntry) => {
        const data = [{
            opid: 0,
            value: treasure.value.treasureItemIndex,
            nullifier: BigInt(treasure.commitment)
        }]

        // const proof = Gribi.prove(RevealLoot, {
        //     //the public context here needs to include the commitment to the treasure and also the opening
        //     public_context: {
        //         player_storage: [treasure.value.treasureItemIndex],
        //     }, 
        //     private_context: {

        //     },
        //     Operation: {
        //         nullifier: Utils.pedersenHash([treasure.commitment, Vault.walletAddress])
        //     },
        // });
        const tx = await Gribi.createGribiTx(
            TREASURE_ID,
            "revealTreasure",
            [{value: treasure.commitment, slot: 0}],
            data,
            RevealLoot
        )
        await call(tx);
        Vault.removeEntry(Gribi.walletAddress, TREASURE_ID, treasure);
        // Vault.remove(treasure).onCondition(
        //     Gribi.send
        // )
    }

    const test = async () => {
        const data = [{
            opid: 0,
            value: 1,
        }];

        const tx = await Gribi.createGribiTx(
            TREASURE_ID,
            "test",
            [],
            data
        );
        await call(tx);
    }

    return {
        test
        // openTreasureBox,
        // claimTreasure,
        // revealTreasure
    }
}