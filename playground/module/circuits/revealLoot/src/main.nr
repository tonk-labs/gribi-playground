//looks exactly like claimLoot
use dep::std;
use dep::gribi_std::{Operation, Input};

//the example signature of what a gribi module circuit looks like
fn main(
	address: Field,
	inputs: pub [Input; 8],
	operations: pub [Operation; 8], //given 8 maximum, which seems like more than anyone would need
	//I mean just in case for crazy shit we keep these???
	commitment_root: Field, 
	nullifier_root: Field,
	public_root: Field,
) {
}