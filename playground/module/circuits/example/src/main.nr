use dep::std;
use dep::gribi_std::{Operation, Input};


//Example signature of what a gribi module circuit looks like
fn main(
	// TODO: IDEALLY WE GET THESE ALL THROUGH ORACLE
	address: pub Field,
	inputs: pub [Input; 8],
	operations: pub [Operation; 8], //given 8 maximum, which seems like more than anyone would need

	//I mean just in case for crazy shit we keep these???
	commitment_root: pub Field, 
	nullifier_root: pub Field,
	public_root: pub Field,

	//Arbitrary private variables would go below here
	....
) {
	// this means, most logic is on JS side
	// the circuit logic just validates "correctness"
}