# How to Use a Module in MUD

In this tutorial, we will take a look at how a simple MUD game, Emojimon, integrates with the Example module available in the `playground/module` folder. This Example module exposes a commit, update and reveal API. Something that might be useful for our emojimon game! 

Prerequisite: it is recommended to read the first few paragraphs of the [How to Write a Module]() tutorial to understand the high-level architecture of a Gribi module. 

## Table of Contents
- [Setup & Install](#setup--install)
    - [Install Gribi](#install-gribi)
    - [Install the Module](#install-the-module)
- [gribi/CommitUpdateReveal.ts](#gribicommitupdaterevealts)
    - [Selectors](#selectors)


## Setup & Install

The process of setting up and installing Gribi still requires many manual steps. The mud project in the `playground/game` folder comes pre-setup for you. We will go through these manual steps now one by one.


> NOTE!!! This is already done in our `playground/game`, so only follow these install instructions if you are setting up Gribi from scratch in a new project.

### Install Gribi


> WARNING: These commands and instructions are only for new project setup. If you are using Gribi Playground this has already been setup for you, so please skip down to the [gribi/Example.ts](#gribiexamplets) section.

In the `contracts/` folder run:
```
pnpm i @gribi/evm-rootsystem-contracts
```

We'll need to add to the remappings.txt to include the @gribi contracts
```
@gribi/evm-rootsystem=./node_modules/@gribi/evm-rootsystem-contracts/src
```

In `contracts/script` we have both an extra script and a modified PostDeploy.s.sol

`contracts/script/deployGribi.js` deploys the Gribi contract to a predictable address when you launch. You will want to copy this over to your new project.


In `contracts/script/PostDeploy.s.sol` we set that address into a special MUD singleton called GribiConfig. Make sure this address is the same as the one printed out when you run deployGribi.js.
```
GribiConfig.set(address(0xD8163ADc3169d7dab93fe9858F9cEaEBaD7f7845));
```

Add the following to your `mud.config.ts`
```
    GribiConfig: {
      key: [],
      schema: {
        contractAddress: "address",
      },
      codegen: {
        dataStruct: false
      },
    },
```

We also use `contracts/systems/GribiSystem.sol` to communicate with Gribi from the client. That is, Gribi piggybacks off the MUD network glue code to send messages from the client. You will need to copy this over to your project.

The `GribiSystem.sol` is also where you will register your modules. You can see an example of how the Example module is registered.

Finally, for convenience, change the `playground/game/mprocs.yaml` to include the following:
```
gribi:
    cwd: packages/contracts
    shell: sleep 1 && pnpm run deploy:gribi
    autostart: true
```

and add to the scripts in `contracts/package.json` the following line

```
    ...
    "deploy:gribi": "node ./script/deployGribi.js",
    ...
```

This will automatically deploy gribi when you run `pnpm dev` at the top level.


<br/>
<br/>


In the `client/` folder run:
```
pnpm i @gribi/evm-rootsystem @gribi/mud @gribi/types @gribi/vault
```

In the `client/mud/setup.ts` file you will want to add the following.

```typescript
import { privateState } from "../gribi/state";
...
return {
    privateState,
    ...
}
```

Now create a state `client/gribi/state.ts` file and we can setup the following chunk of code to get ready for our modules.


This is already setup to include one selector from our Exmaple module. A blank privateState would simply look like:

```
import { createSecretsState } from "@gribi/mud";

export const privateState: () => SecretState = createSecretsState({ });
```



### Install the Module

Assuming you have built your module, you can then install it using NPM int th `packages/client` directory. In the gribi-playground you can see the module package is installed with a relative path.

If your modules include contracts, make sure to install your module with NPM into the `packages/contracts` directory as well and to update your foundry remappings to the appropriate spot.

We also suggest to include a `gribi/index.ts` file which conveniently will collect all your modules together. Here is the example module used in playground.

```typescript
import * as CUR from './CommitUpdateReveal';
import { Module, NetworkCall } from '@gribi/mud';

const CommitUpdateReveal: Module<CUR.ModuleCalls> = CUR; 

const Modules = [ 
    CommitUpdateReveal
];

export default Modules;
```

In the `packages/congracts/src/systems` you can register your module on the GribiSystem in a similar manner to the example below. 

```
function registerModules(address gribiAddress) public {
    Gribi gribi = Gribi(gribiAddress);
    BaseThread[] memory threads = new BaseThread[](1);

    //TODO: Register your module here
    threads[0] = new Example();
    gribi.registerThreads(threads);
}
```


# [gribi/CommitUpdateReveal.ts](packages/client/src/gribi/CommitUpdateReveal.ts)

Most of the logic starts in the [client/gribi/CommitUpdateReveal.ts](packages/client/src/gribi/CommitUpdateReveal.ts) file which looks something like this:

```typescript
export function createModuleCalls(call: NetworkCall)  {
    const createCommitment = async (secret: number) => {
        ...
    }

    //other functions here
}
```

this is convenient for us, as the NetworkCall is simply using MUD to send the transactions through to our `GribiSystem.sol` contract.

In the file [client/mud/createSystemCalls.ts](packages/client/src/mud/createSystemCalls.ts) we define our NetworkCall as follows:
```typescript
 const mudCall: NetworkCall = async (transaction: Transaction) => {
    let tx;
    if (transaction.proof) {
      // tx = await worldContract.write.execute([transaction.id, transaction.data, transaction.proof.data]);
      // proofs are turned off until KernelCircuit is done
      tx = await worldContract.write.execute([transaction.id as bigint, transaction.data]);
    } else {
      tx = await worldContract.write.execute([transaction.id as bigint, transaction.data]);
    }
    await waitForTransaction(tx);
  };
```

Now let's look at the meat of the CommitUpdateReveal.ts file. This file uses our module interfaces to configure client state, make system calls, etc and expose that to the react app much in the same way the other MUD system call functions do. `createModuleCalls` defines separate functions but they are all of similar structure, so we can just look at one of the functions as an example.

```typescript
const createCommitment = async (secret: number) => {
    const salt = Utils.rng() as bigint;
    const witness = await new CreateCommitment().bond({
        secret, 
        salt,
    });

    const entry = {
        slot: 0,
        value: witness
    }

    const signal = await new CreateCommitmentReceptor().signal(witness);
    const txs = await EVMRootSystem.createTxs([signal]);
    await Promise.all(txs.map(async (tx) => await call(tx)));
    Vault.setEntry(EVMRootSystem.walletAddress, MODULE_ID.toString(), entry);
}
```

1. The CreateCommitment API requires two inputs, a secret and salt. This gives us a WitnessRelation object. 

2. This is a convenient package for us to store in our Vault, but we'll need to give it a slot in the Vault so we create our entry object.

3. CreateCommitmentReceptor conveniently also takes our WitnessRelation object. That gives us a signal.

4. Our EVMRootSystem can then use this signal to create a set of Transactions.

5. We feed these transactions to our NetworkCall in the outer context.

6. Finally once it's all successful, we store the WitnessRelation for later use in our Vault.

<br/>
<br/>


### Selectors

Selectors allow us to cleanly map entries in our Vault to entries in our React state tree. Here our selector simply returns where the latest commit is stored.

[client/gribi/CommitUpdateReveal.ts](packages/client/src/gribi/CommitUpdateReveal.ts)
```typescript
export class CommitSelector implements Selector {
    select(): number | null  {
        const entry = Vault.getDataAtSlot(EVMRootSystem.walletAddress, MODULE_ID.toString(), 0) as PrivateEntry<WitnessRelation<Commitment[], StoredCommitment>>;
        if (!entry) {
            return null;
        } else {
            return entry.value.witness.secret.slice(-1)[0] as number;
        }
    }
}
```


In the state file, we can define the structure of our tree and the `createSecretState` method will format our tree in such a way which is convenient for us to read in React. Given the definition below, our secret we've committed to is revealed to the React application at:

```typescript
{
    example: {
        secret: //our secret
    }
}
```


[client/gribi/state.ts](packages/client/src/gribi/state.ts)
```typescript
import { createSecretsState } from "@gribi/mud";
import { CommitSelector } from "./CommitUpdateReveal";

export type SecretState = {
    example: {
        secret: number
    }
}

export const privateState: () => SecretState = createSecretsState({
    example: {
        children: {
            secret: {
                selector: new CommitSelector(),
            }
        }
    }
});
```
