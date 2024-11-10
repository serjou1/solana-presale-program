// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import FlarytokenpresaleIDL from '../target/idl/flary_token_sale.json'
import type { FlaryTokenSale } from '../target/types/flary_token_sale'

// Re-export the generated IDL and type
export { FlaryTokenSale, FlarytokenpresaleIDL }

// The programId is imported from the program IDL.
export const FLARYTOKENPRESALE_PROGRAM_ID = new PublicKey(FlarytokenpresaleIDL.address)

// This is a helper function to get the Flarytokenpresale Anchor program.
export function getFlarytokenpresaleProgram(provider: AnchorProvider) {
  return new Program(FlarytokenpresaleIDL as FlaryTokenSale, provider)
}

// This is a helper function to get the program ID for the Flarytokenpresale program depending on the cluster.
export function getFlarytokenpresaleProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Flarytokenpresale program on devnet and testnet.
      return new PublicKey('CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg')
    case 'mainnet-beta':
    default:
      return FLARYTOKENPRESALE_PROGRAM_ID
  }
}
