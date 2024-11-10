import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { FlaryTokenSale } from '../target/types/flary_token_sale';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

import { airdropIfRequired } from "@solana-developers/helpers";
import { Account, createMint, getAccount, getAssociatedTokenAddress, getMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { AMOUNT_USDT_TO_BUY, EXPECTED_AMOUNT_OF_TOKENS, TOKEN_DECIMALS, TOKEN_PRICE_IN_USDT } from './constants';
import { bigNumberToBigInt, getAmountUsdtToBuyBn, getExpectedAmountOfTokensBn, getTokenPriceBn } from './utils';

import { HermesClient } from "@pythnetwork/hermes-client";


const SOL_USD_PRICE_FEED = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const hermesConnection = new HermesClient("https://hermes.pyth.network", {});

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;

const flaryTokenSaleAddress = new PublicKey("2EBs8GKZGfrnQSdhQfHmxa1Mik2UgGXRV6kRjS4h8G8T");

describe('Flary', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const saleProgram = new Program(IDL, { connection });

  const payer = (provider.wallet as anchor.Wallet).payer;

  console.log("payer", payer.publicKey.toBase58());

  const connection = provider.connection;

  const owner = anchor.web3.Keypair.fromSecretKey(bs58.decode("6NrsH4vwWkwZ6KDyJ372HpyTLzg6GVXcxA5AK8apMGJC3Rut85hBny3vHfV7f4zvfRVgtaK34kcd7F5ZxRmTkPL"));
  const regularUser = anchor.web3.Keypair.fromSecretKey(bs58.decode("4FqsHM5Cicyoivvdg4yVHyYKr5YUHXTncQWuvdyLwg22PUwpp1MSziPo7yyjxfh6YLHVHECuQSVr6gQ34GYPBKFS"));
  const usdtMint = anchor.web3.Keypair.fromSecretKey(bs58.decode("49vQjFhV3SiKabiDUmec51Cr1WNC7TmCts33hpYthCYdugmWsZZoy4Am2X4SrQBzLvynLeG5iQ3xoi25wUvoDQ68"));

  console.log("owner", owner.publicKey.toBase58());
  console.log("regularUser", regularUser.publicKey.toBase58());
  console.log("usdtMint", usdtMint.publicKey.toBase58());

  let userTokenAccount: Account;

  const mintAmount = 100000000000000;

  beforeAll(
    async () => {
      console.log("requesting airdrop");
      await airdropIfRequired(connection, owner.publicKey, 0.5 * LAMPORTS_PER_SOL, 1 * LAMPORTS_PER_SOL);
      await airdropIfRequired(connection, regularUser.publicKey, 0.5 * LAMPORTS_PER_SOL, 1 * LAMPORTS_PER_SOL);

      console.log("creating mints");
      try {
        console.log("getting usdt mint");
        await getMint(connection, usdtMint.publicKey, 'finalized', TOKEN_PROGRAM);
        console.log("usdt mint already exists");
      } catch (e) {
        console.log(e);

        console.log("usdt mint does not exist, creating usdt mint");

        await createMint(
          connection,
          payer,
          payer.publicKey,
          null,
          6,
          usdtMint,
          {
            commitment: "finalized"
          },
          TOKEN_PROGRAM
        );
      }

      console.log("creating token accounts");
      try {
        await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          usdtMint.publicKey,
          regularUser.publicKey,
          false,
          'finalized',
          {},
          TOKEN_PROGRAM
        );
      } catch (e) {
        console.log("Failed to create associated token account ", e);
      }

      userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        usdtMint.publicKey,
        regularUser.publicKey,
        false,
        'finalized',
        {},
        TOKEN_PROGRAM
      );

      console.log("USDT token account", userTokenAccount.address.toBase58());

      const tokenAccount = await getAccount(
        connection,
        userTokenAccount.address,
        "confirmed",
        TOKEN_PROGRAM);

      if (tokenAccount.amount === BigInt(0)) {
        console.log("minting to user");
        await mintTo(
          connection,
          payer,
          usdtMint.publicKey,
          userTokenAccount.address,
          payer,
          100000000000000,
          undefined,
          {},
          TOKEN_PROGRAM
        );
      }

      console.log("preparation done");
    },
    2147483647
  );

  it('Initialize Sale', async () => {
    const initialPrice = getTokenPriceBn(TOKEN_PRICE_IN_USDT);

    console.log("getting sale address");
    const [saleAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale")],
      flaryTokenSaleAddress
    );

    try {
      console.log("fetching sale account");
      await saleProgram.account.sale.fetch(saleAddress);
      console.log("sale account already exists");
    } catch (e) {
      console.log("sale account does not exist, initializing sale");

      await saleProgram.methods.initializeSale(
        new anchor.BN(initialPrice),
        usdtMint.publicKey
      )
        .accounts({
          usdtMint: usdtMint.publicKey,
          signer: owner.publicKey,
          tokenProgram: TOKEN_PROGRAM,
        })
        .signers([owner])
        .rpc();

      console.log("sale account initialized");
    }

    console.log("fetching sale account");
    const sale = await saleProgram.account.sale.fetch(saleAddress);
    console.log(sale);

    expect(sale.isPaused).toBe(false);
    // expect(sale.tokenPrice.toNumber()).toEqual(initialPrice);
  },
    2147483647);

  const setPriceByOwner = async (newPrice: number) => {
    const newPriceBn = getTokenPriceBn(newPrice);

    await saleProgram.methods.changePrice(
      newPriceBn
    )
      .accounts({
        owner: owner.publicKey,
        // sale: flaryTokenSaleAddress
      })
      .signers([owner])
      .rpc();
  };

  it('Owner Change Price Success', async () => {
    const newPrice = 0.2;

    await setPriceByOwner(newPrice);

    const [saleAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale")],
      flaryTokenSaleAddress
    );

    const sale = await saleProgram.account.sale.fetch(saleAddress);
    console.log(sale);

    expect(bigNumberToBigInt(sale.tokenPrice)).toEqual(bigNumberToBigInt(getTokenPriceBn(newPrice)));
  });

  it('Regular User Change Price Fail', async () => {
    const regularUserChangePrice = async () => {
      const newPrice = 3000;

      await saleProgram.methods.changePrice(
        new anchor.BN(newPrice)
      )
        .accounts({
          owner: regularUser.publicKey
        })
        .signers([regularUser])
        .rpc();
    };

    await expect(regularUserChangePrice).rejects.toThrow("Access denied");
  });

  const pauseByOwner = async () => {
    await saleProgram.methods.pauseSale()
      .accounts({
        owner: owner.publicKey
      })
      .signers([owner])
      .rpc();
  };

  it('Owner Pause Sale Success', async () => {
    await pauseByOwner();

    const [saleAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale")],
      flaryTokenSaleAddress
    );

    const sale = await saleProgram.account.sale.fetch(saleAddress);
    console.log(sale);

    expect(sale.isPaused).toBe(true);
  });

  it('Regular User Pause Sale Fail', async () => {
    const regularUserPauseSale = async () => {
      await saleProgram.methods.pauseSale()
        .accounts({
          owner: regularUser.publicKey
        })
        .signers([regularUser]).rpc();
    };

    await expect(regularUserPauseSale).rejects.toThrow("Access denied");
  });

  const unpauseByOwner = async () => {
    await saleProgram.methods.unpauseSale()
      .accounts({
        owner: owner.publicKey
      })
      .signers([owner])
      .rpc();
  };

  it('Owner Unpause Sale Success', async () => {
    await unpauseByOwner();

    const [saleAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale")],
      flaryTokenSaleAddress
    );

    const sale = await saleProgram.account.sale.fetch(saleAddress);
    console.log(sale);

    expect(sale.isPaused).toBe(false);
  });

  it('Regular User Unpause Sale Fail', async () => {
    const regularUserUnpauseSale = async () => {
      await saleProgram.methods.unpauseSale()
        .accounts(
          {
            owner: regularUser.publicKey
          }
        )
        .signers([regularUser]).rpc();
    };

    await expect(regularUserUnpauseSale).rejects.toThrow("Access denied");
  });

  const buyTokensByUserForUsdt = async (amount: anchor.BN) => {
    await saleProgram.methods.buyTokensUsdt(amount)
      .accounts({
        usdtMint: usdtMint.publicKey,
        tokenProgram: TOKEN_PROGRAM,
        //@ts-ignore
        signerUsdtMint: userTokenAccount.address,
        user: regularUser.publicKey,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .signers([regularUser])
      .rpc();
  };

  it('Buy Token When Unpaused Sussess and amount is correct', async () => {
    await setPriceByOwner(TOKEN_PRICE_IN_USDT);

    const usdtAmountBn = getAmountUsdtToBuyBn(AMOUNT_USDT_TO_BUY);

    let initialTokensAmount = new anchor.BN(0);

    const [userSaleStateAddress] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_sale_state"),
        regularUser.publicKey.toBuffer()
      ],
      flaryTokenSaleAddress,
    );
    try {
      const userSaleStateInitial = await saleProgram.account.userSaleState.fetch(userSaleStateAddress);
      initialTokensAmount = initialTokensAmount.add(userSaleStateInitial.tokenAmount);
    } catch { }

    await buyTokensByUserForUsdt(usdtAmountBn);

    const tokensAmount = getExpectedAmountOfTokensBn(EXPECTED_AMOUNT_OF_TOKENS);

    const userSaleState = await saleProgram.account.userSaleState.fetch(userSaleStateAddress);

    const [saleAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("sale")],
      flaryTokenSaleAddress
    );

    const sale = await saleProgram.account.sale.fetch(saleAddress);

    const calculatedAmount = usdtAmountBn.mul(new anchor.BN(10).pow(new anchor.BN(TOKEN_DECIMALS))).div(sale.tokenPrice);

    const expectedFinalAmount = initialTokensAmount.add(tokensAmount);

    console.log("calculatedAmount", bigNumberToBigInt(calculatedAmount));
    console.log("tokensAmount", bigNumberToBigInt(tokensAmount));
    console.log("userSaleState.tokenAmount", bigNumberToBigInt(userSaleState.tokenAmount));
    console.log("expectedFinalAmount", bigNumberToBigInt(expectedFinalAmount));

    expect(bigNumberToBigInt(calculatedAmount)).toEqual(bigNumberToBigInt(tokensAmount));
    expect(bigNumberToBigInt(userSaleState.tokenAmount)).toEqual(bigNumberToBigInt(expectedFinalAmount));
  });

  it('Buy Token When Paused Fail', async () => {
    await pauseByOwner();

    const buyTokens = async () => {
      await buyTokensByUserForUsdt(new anchor.BN(1_000_000));
    }

    await expect(buyTokens).rejects.toThrow("Sale is paused");

    await unpauseByOwner();
  });

  it('Buy Token When USDT is not enough Fail', async () => {
    const buyTooMuchTokens = async () => {
      await buyTokensByUserForUsdt(new anchor.BN(mintAmount * 1000));
    }
    await expect(buyTooMuchTokens).rejects.toThrow();
  });

  const SOL_AMOUNT_TO_BUY_TOKENS = 0.1;

  it('Buy Tokens with solana', async () => {
    try {
      let initialTokensAmount = new anchor.BN(0);

      const [userSaleStateAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_sale_state"),
          regularUser.publicKey.toBuffer()
        ],
        flaryTokenSaleAddress,
      );

      try {
        const userSaleStateInitial = await saleProgram.account.userSaleState.fetch(userSaleStateAddress);
        initialTokensAmount = initialTokensAmount.add(userSaleStateInitial.tokenAmount);
      } catch { }

      const solanaAmountBn = new anchor.BN(SOL_AMOUNT_TO_BUY_TOKENS * LAMPORTS_PER_SOL);

      console.log("buying tokens with solana");
      const tx = await saleProgram.methods.buyTokensSol(
        solanaAmountBn
      )
        .accounts({
          user: regularUser.publicKey,
          //@ts-ignore
          systemProgram: SYSTEM_PROGRAM_ID,
        })
        .signers([regularUser])
        .rpc();

      const feeds = await hermesConnection.getLatestPriceUpdates([SOL_USD_PRICE_FEED]);

      if (!feeds.parsed || feeds.parsed.length === 0) {
        throw new Error("No price feed data available");
      }
      const { price } = feeds.parsed[0];

      const minTokensAmount = getExpectedAmountOfTokensBn(SOL_AMOUNT_TO_BUY_TOKENS * 0.98 * Number(price.price) * Math.pow(10, price.expo) / TOKEN_PRICE_IN_USDT);
      const maxTokensAmount = getExpectedAmountOfTokensBn(SOL_AMOUNT_TO_BUY_TOKENS * 1.02 * Number(price.price) * Math.pow(10, price.expo) / TOKEN_PRICE_IN_USDT);

      const userSaleState = await saleProgram.account.userSaleState.fetch(userSaleStateAddress);

      expect(bigNumberToBigInt(userSaleState.tokenAmount)).toBeGreaterThanOrEqual(bigNumberToBigInt(initialTokensAmount.add(minTokensAmount)));
      expect(bigNumberToBigInt(userSaleState.tokenAmount)).toBeLessThanOrEqual(bigNumberToBigInt(initialTokensAmount.add(maxTokensAmount)));
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it(
    'Withdraw USDT to owner', async () => {
      console.log("withdraw usdt to owner");

      const [saleAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("sale")],
        flaryTokenSaleAddress
      );

      console.log("Sale address", saleAddress.toBase58());

      const usdtStorage = await getAssociatedTokenAddress(
        usdtMint.publicKey,
        saleAddress,
        true,
        TOKEN_PROGRAM
      );

      console.log("USDT storage", usdtStorage.toBase58());

      const account = await getAccount(
        connection,
        usdtStorage,
        "confirmed",
        TOKEN_PROGRAM
      );

      console.log("account", account);

      const initialUsdtStorageBalance = account.amount;

      let ownerUsdtBalanceInitial = BigInt(0);

      console.log("getting owner usdt account address");

      const ownerUsdtAccountAddress = await getAssociatedTokenAddress(
        usdtMint.publicKey,
        owner.publicKey,
        false,
        TOKEN_PROGRAM
      );

      console.log("owner usdt account address", ownerUsdtAccountAddress.toBase58());

      try {

        console.log("getting owner usdt account");

        const ownerInitialUsdtAccount = await getAccount(
          connection,
          ownerUsdtAccountAddress,
          "confirmed",
          TOKEN_PROGRAM
        );
        console.log("owner usdt account", ownerInitialUsdtAccount);

        ownerUsdtBalanceInitial = ownerInitialUsdtAccount.amount;

      } catch (e) {
        console.log("Failed to get owner usdt account", e);
      }

      try {
        console.log("withdrawing usdt");
        const tx = await saleProgram.methods.withdrawUsdt()
          .accounts({
            usdtMint: usdtMint.publicKey,
            tokenProgram: TOKEN_PROGRAM,
            //@ts-ignore
            owner: owner.publicKey,
          })
          .signers([owner])
          .rpc();

        console.log("withdraw usdt tx", tx);
      } catch (e) {
        console.log("Failed to withdraw usdt");
        console.log(e);

        throw e;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const accountAfter = await getAccount(
        connection,
        usdtStorage,
        "confirmed",
        TOKEN_PROGRAM
      );

      const ownerUsdtAccount = await getAccount(
        connection,
        ownerUsdtAccountAddress,
        "confirmed",
        TOKEN_PROGRAM
      );

      expect(accountAfter.amount).toEqual(BigInt(0));
      expect(ownerUsdtAccount.amount).toEqual(initialUsdtStorageBalance + ownerUsdtBalanceInitial);
    },
    2147483647
  )

  it(
    "Regular user withdraw USDT fail", async () => {
      const regularUserWithdrawUsdt = async () => {
        await saleProgram.methods.withdrawUsdt()
          .accounts({
            usdtMint: usdtMint.publicKey,
            tokenProgram: TOKEN_PROGRAM,
            //@ts-ignore
            owner: regularUser.publicKey,
          })
          .signers([regularUser])
          .rpc();
      };

      await expect(regularUserWithdrawUsdt).rejects.toThrow("Access denied");
    }
  );

  const withdrawSol = async (
    user: anchor.web3.Keypair
  ) => {
    const [saleWalletPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("sale_wallet")],
      flaryTokenSaleAddress
    );

    await saleProgram.methods.withdrawSol()
      .accounts({
        owner: user.publicKey,
        //@ts-ignore
        systemProgram: SYSTEM_PROGRAM_ID,
        saleWallet: saleWalletPDA
      })
      .signers([user])
      .rpc();
  };
  it("Withdraw SOL to owner", async () => {
    await withdrawSol(owner);
  });

  it("Regular user withdraw SOL fail", async () => {
    const regularUserWithdrawSol = async () => {
      await withdrawSol(regularUser);
    };

    await expect(regularUserWithdrawSol).rejects.toThrow("Access denied");
  });
});
