// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import FlarytokenpresaleIDL from '../target/idl/flarytokenpresale.json'
import type { Flarytokenpresale } from '../target/types/flarytokenpresale'

// Re-export the generated IDL and type
export { Flarytokenpresale, FlarytokenpresaleIDL }

// The programId is imported from the program IDL.
export const FLARYTOKENPRESALE_PROGRAM_ID = new PublicKey(FlarytokenpresaleIDL.address)

// This is a helper function to get the Flarytokenpresale Anchor program.
export function getFlarytokenpresaleProgram(provider: AnchorProvider) {
  return new Program(FlarytokenpresaleIDL as Flarytokenpresale, provider)
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
