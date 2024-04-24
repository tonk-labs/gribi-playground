use dep::std;

struct Operation {
	opid: Field,
	value: Field,
	nullifier: Field,
}

struct Input {
    slot: Field,
    value: Field,
}

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
	commitment: Field,
	secret: Field,
	salt: Field
) {
	// this means, most logic is on JS side
	// the circuit logic just validates correctness
	let commit = std::hash::pedersen_hash([secret, salt, 0, 0, 0, 0, 0, 0]);
	std::println(commit);
	assert(commitment == commit);
}

#[test]
fn test_main() {
	let commitment = 0x21c418d83d736aad0860803c962fec2a567ca98c4cbb9a0cec65a68afe12cbfb;
	let secret = 0x0;
	let salt = 0xe8e1fd548995aa1780235b32ca5195050f898d9aecfba4009388824898f82d;
	let address = 0xabcdef123456789;
	let inputs = [Input { slot: 0, value: 0 }; 8]; // Assuming default values for slot and value
	let operations = [Operation { opid: 0, value: 0, nullifier: 0 }; 8]; // Assuming default values for opid, value, and nullifier
	let commitment_root = 0x292099dc682fac02111f941c6058b2b137b25ed83ac9b823f973f2021eb835e3;
	let nullifier_root = 0xabcdef123456789;
	let public_root = 0xabcdef123456789;

	main(address, inputs, operations, commitment_root, nullifier_root, public_root, commitment, secret, salt);
}

