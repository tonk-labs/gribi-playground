public inputs have a slot 
public inputs have, two arrays 8 entries for the public inputs and 8 entries
no restraint on private variables 

make a new Example.ts 

main focus on just modifying modules

what's the output of the revealCommitment function

reveal slot is a table need to setup in mud to handle that, any public state you have to render make a special table for 

player is the one doing the reveal when the gribi system solidity contract is handling the return values from that gribi thread it will automatically have a way to get the key of the player in the table of information, can look at other mud systems for how its done

if you look at the map system address to entity key and get the message sender then you can get now that you have the entity key for the player you can store in their reveal table what you need to store there, all the other players will do the same thing and everyone will see the state what the client is doing 

the trap mechanism is how difficult it is to interact that the trap is there, is twitchy 

go ahead and modify the gribi system file directly if you want to shuffle return values back into table instead of doing anything clever there, you 

hit specific logi

typescript game client code needs to have explicit types on each variable to make it more readable


this calls into Modules
playground/game/packages/client/src/mud/createSystemCalls.ts
the system register modules
playground/game/packages/client/src/mud/setup.ts
the game needs to run setup() which registers all the modules before rendering 
playground/game/packages/client/src/index.tsx

systemCalls somehow is a struct with 

systemCalls sd

1. add 2 keystroke to useKeyboardMovement.ts
2. make it commit something
3. make it reveal something 
4. render the reveal 


# TODO

- [ ] add detonate to playground/game/packages/contracts/out/IWorld.sol/IWorld.abi.json.d.ts
- [ ] if a player places a bomb (commitment), they need to be see it in the game