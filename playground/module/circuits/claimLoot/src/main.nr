use dep::std;
use dep::gribi_std::{Operation, Input};


//the example signature of what a gribi module circuit looks like
fn main(
	// TODO: IDEALLY WE GET THESE ALL THROUGH ORACLE
	address: pub Field,
	inputs: pub [Input; 8],
	operations: pub [Operation; 8], //given 8 maximum, which seems like more than anyone would need
	//I mean just in case for crazy shit we keep these???
	commitment_root: pub Field, 
	nullifier_root: pub Field,
	public_root: pub Field,

	salt: Field,
	commitment: Field, //well need a commitment path to prove that its a valid commitment

) {
	// this means, most logic is on JS side
	// the circuit logic just validates "correctness"

	// need to make sure the commitment is using the instanceID so we can nullify it later
	// check the randomness is joined correctly
	//( but we need this commitment to somehow show up in the public inputs or we prove that it's just A VALID COMMITMENT... yeesh )
	// values without a slot are special data I guess that contract can "do stuff" with?? we're not trying to get fancy
	// if we can efficiently do merkle tree proofs awesome, but for now no

	//check that the randomness used does equal the commitment (we can reveal which one who cares) 
	//we will later emit a nullifier for the use of that commitment and the contract will check it
}