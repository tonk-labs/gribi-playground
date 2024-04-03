import { NetworkCall } from '@gribi/mud';
import { keccak256, toHex, encodePacked } from 'viem';

// import { }




export type ModuleCalls = ReturnType<typeof createModuleCalls>;

export function createModuleCalls(call: NetworkCall) {

    const createCommitment = (secret: number) => {

    }

    return {
        // createCommitment,
        // revealCommitment
    }

}