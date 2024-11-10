'use client'

import {getFlarytokenpresaleProgram, getFlarytokenpresaleProgramId} from '@project/anchor'
import {useConnection} from '@solana/wallet-adapter-react'
import {Cluster, Keypair, PublicKey} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import toast from 'react-hot-toast'
import {useCluster} from '../cluster/cluster-data-access'
import {useAnchorProvider} from '../solana/solana-provider'
import {useTransactionToast} from '../ui/ui-layout'

export function useFlarytokenpresaleProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getFlarytokenpresaleProgramId(cluster.network as Cluster), [cluster])
  const program = getFlarytokenpresaleProgram(provider)

  const accounts = useQuery({
    queryKey: ['flarytokenpresale', 'all', { cluster }],
    queryFn: () => program.account.flarytokenpresale.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['flarytokenpresale', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ flarytokenpresale: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useFlarytokenpresaleProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useFlarytokenpresaleProgram()

  const accountQuery = useQuery({
    queryKey: ['flarytokenpresale', 'fetch', { cluster, account }],
    queryFn: () => program.account.flarytokenpresale.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['flarytokenpresale', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ flarytokenpresale: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['flarytokenpresale', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ flarytokenpresale: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['flarytokenpresale', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ flarytokenpresale: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['flarytokenpresale', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ flarytokenpresale: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
