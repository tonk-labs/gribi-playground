import { NetworkCall, Selector } from '@gribi/mud';
import { WitnessRelation } from '@gribi/types';
import { EVMRootSystem } from '@gribi/evm-rootsystem';
import { Vault, Utils, PrivateEntry } from '@gribi/vault';
import {
    Position,
    UpdatePositionReceptor,
    HideMovementReceptor,
    MODULE_ID,
    Commitment,
    Witness,
    StateUpdateWithWitnessRelation,
    RevealPositionReceptor

} from 'hidden-movement';

export type ModuleCalls = ReturnType<typeof createModuleCalls>;

export function createModuleCalls(call: NetworkCall) {

    const hide = async (position: Position) => {




        const { output: { stateUpdate, witnessRelation } } = await new HideMovementReceptor().signal(position);

        const txs = await EVMRootSystem.createTxs([stateUpdate]);
        const entry = { slot: 0, value: witnessRelation.toString() };
        await Promise.all(txs.map(async (tx: any) => await call(tx)));

        Vault.setEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
    }

    const updatePosition = async (newPosition: Position) => {
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment, Witness>>;
        const positionUpdate = {
            currentClaim: entry.value.claim,
            currentPosition: entry.value.witness.position,
            newPosition
        }

        const { output: { stateUpdate, witnessRelation } } = await new UpdatePositionReceptor().signal(positionUpdate);
        entry.value = witnessRelation.toString();
        const txs = await EVMRootSystem.createTxs([stateUpdate]);
        await Promise.all(txs.map(async (tx: any) => await call(tx)));
        Vault.setEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
    }

    const revealPosition = async () => {
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment, Witness>>;
        const signal = await new RevealPositionReceptor().signal(entry.value);
        const txs = await EVMRootSystem.createTxs([signal]);
        await Promise.all(txs.map(async (tx: any) => await call(tx)));
        Vault.removeEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
    }

    return {
        hide,
        updatePosition,
        revealPosition
    }
}

export class CommitSelector implements Selector {
    select(): number | null {
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment, Witness>>;
        if (!entry) {
            return null;
        } else {
            return entry.value.witness.position as Position;
        }
    }
}
