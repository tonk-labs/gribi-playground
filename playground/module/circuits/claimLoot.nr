use dep::std;

//the example signature of what a gribi module circuit looks like
fn module_bin(
	public_context: pub PublicContext,
	private_context: PrivateContext,
	transaction: Transaction,
  ...optional private arguments
) {
	// this means, most logic is on JS side
	// the circuit logic just validates "correctness"
    let hash = std::hash::pedersen_hash(&private_context.player_storage[0..2])
    assert(hash == transaction.data.commitment);
}