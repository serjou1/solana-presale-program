'use client'

import { PublicKey, Transaction } from '@solana/web3.js';
import { AppHero } from '../ui/ui-layout'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@coral-xyz/anchor';
import { BN, Program } from "@coral-xyz/anchor";

const links: { label: string; href: string }[] = [
  { label: 'Solana Docs', href: 'https://docs.solana.com/' },
  { label: 'Solana Faucet', href: 'https://faucet.solana.com/' },
  { label: 'Solana Cookbook', href: 'https://solanacookbook.com/' },
  { label: 'Solana Stack Overflow', href: 'https://solana.stackexchange.com/' },
  { label: 'Solana Developers GitHub', href: 'https://github.com/solana-developers/' },
]
import IDL from './IDL.json';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
const TOKEN_PROGRAM = TOKEN_PROGRAM_ID;

export const USDT_DECIMALS = 6;

const runTransaction = async () => { };

export const getTokenPriceBn = (
  tokenPrice: number
) => {
  return new anchor.BN(tokenPrice * 10 ** (USDT_DECIMALS));
};

const usdtMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const flaryTokenSaleAddress = new PublicKey("2EBs8GKZGfrnQSdhQfHmxa1Mik2UgGXRV6kRjS4h8G8T");

export default function DashboardFeature() {

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const withdrawUsdt = async () => {

    //@ts-ignore
    const saleProgram = new Program(IDL, { connection });

    const instruction = await saleProgram.methods.withdrawUsdt()
      .accounts({
        usdtMint: usdtMint,
        tokenProgram: TOKEN_PROGRAM,
        //@ts-ignore
        owner: publicKey,
      })
      .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: publicKey,
      ...blockhash
    }).add(instruction);

    const signature = await sendTransaction(transaction, connection)

    const latestBlockhash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
  };

  const withdrawSolana = async () => {
    console.log("withdraw solana");

    //@ts-ignore
    const saleProgram = new Program(IDL, { connection });

    const [saleWalletPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("sale_wallet")],
      flaryTokenSaleAddress
    );

    const instruction = await saleProgram.methods.withdrawSol()
      .accounts({
        //@ts-ignore
        owner: publicKey,
        //@ts-ignore
        systemProgram: SYSTEM_PROGRAM_ID,
        saleWallet: saleWalletPDA
      })
      .instruction();

    const blockhash = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: publicKey,
      ...blockhash
    }).add(instruction);

    const signature = await sendTransaction(transaction, connection)

    const latestBlockhash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')
  };

  const initializeSale = async () => {

    console.log("initializing sale");

    const initialPrice = getTokenPriceBn(0.7);

    console.log("getting sale address");
    const [saleAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale")],
      flaryTokenSaleAddress
    );

    //@ts-ignore
    const saleProgram = new Program(IDL, { connection });

    try {
      console.log("fetching sale account", saleAddress.toBase58());
      //@ts-ignore
      const z = await saleProgram.account.sale.fetch(saleAddress);

      console.log("sale account already exists", z.owner.toBase58(), z.tokenPrice);
    } catch (e) {
      console.log("sale account does not exist, initializing sale");

      const instruction = await saleProgram.methods.initializeSale(
        new anchor.BN(initialPrice),
        usdtMint
      )
        .accounts({
          usdtMint: usdtMint,
          // @ts-ignore
          signer: publicKey,
          tokenProgram: TOKEN_PROGRAM,
        })
        .instruction();

      const blockhash = await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: publicKey,
        ...blockhash
      }).add(instruction);

      const signature = await sendTransaction(transaction, connection)

      const latestBlockhash = await connection.getLatestBlockhash();

      await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

      console.log("sale account initialized");
    }

    console.log("fetching sale account");
    //@ts-ignore
    const sale = await saleProgram.account.sale.fetch(saleAddress);
    console.log(sale);

  };

  return (
    <div>
      {/* <div onClick={}>
        Test
      </div> */}
      <button
        className="btn btn-xs btn-neutral"
        onClick={() => withdrawSolana()}
      >
        пиздануть солярку
      </button>

      <button
        className="btn btn-xs btn-neutral"
        onClick={() => withdrawUsdt()}
      >
        пиздануть доляры
      </button>

      <button
        className="btn btn-xs btn-neutral"
        onClick={() => initializeSale()}
      >
        Initialize sale
      </button>

      <AppHero title="gm" subtitle="Say hi to your new Solana dApp." />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          <p>Here are some helpful links to get you started.</p>
          {links.map((link, index) => (
            <div key={index}>
              <a href={link.href} className="link" target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
