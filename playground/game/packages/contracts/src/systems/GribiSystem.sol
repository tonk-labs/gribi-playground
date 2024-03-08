
import { System } from "@latticexyz/world/src/System.sol";
import { GribiConfig } from "../codegen/index.sol";
import { Gribi } from "@gribi/src/Gribi.sol";
import { Forest } from "@gribi/src/Forest.sol";

struct PublicInput {
    uint256 slot;
    uint256 value;
}

struct Operation {
    uint256 opid;
    uint256 value;
    uint256 slot;
    uint256 nullifier;
}

struct Proof {
    bytes32[] data;
    uint256 circuitKey;
}

contract GribiSystem is System {
    function call(bytes32[] data) public {
        //deserialize data
        //find the module
        //pass the inputs and ops to the correct function on that module
        //if there is a proof, verify it
        //(and feed the key_hash in from the tree for function id from that module)
        //(along with roots of the module)
        //if the proof passes, shuffle along the inputs and ops to the function of the module
        //the module will have access to codegen bits of MUD and ideally would want to build with those in mind
        //however, that's tough, so I think instead what we do is just have the module only use it's internal memory
        //if someone wants to integrate that internal memory into MUD they can do so easily by using some kind of hook mechanism
        //then when it comes to reading from the client, we can write a module (in long term), but in short term just read from Gribi directly (I guess prob easiest thing)
        //the alternative is having the whole fake tree live in MUD
        //...can think about those alternatives
    }
}

// contract LootSystem is System {
//     function getForest() private returns (Forest) {
//         Gribi gribi = Gribi(GribiConfig.get());
//         return gribi.getManager().getForest();
//     }
//     function register() public {
//         //TODO: this shold be moved to a script which somehow registers the modules before hand. We don't want to do this before everything that's dumb.
//         Gribi gribi = Gribi(GribiConfig.get());
//         gribi.getManager().init();
//         Forest forest = gribi.getManager().getForest();
//     }
//     function openTreasureBox() public {
//         Forest forest = getForest();
//         forest.
//     }
// }