use anchor_lang::{prelude::*, system_program};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
use std::str::FromStr;

use crate::{
    error::SaleError,
    state::{Sale, UserSaleState},
};

pub const MAXIMUM_AGE: u64 = 60;
pub const FEED_ID: &str = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

const SOL_USD_FEED: &str = "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE";

#[derive(Accounts)]
pub struct GetSolPrice<'info> {
    #[account(address = Pubkey::from_str(SOL_USD_FEED).unwrap() @ SaleError::InvalidPriceFeed)]
    pub price_update: Account<'info, PriceUpdateV2>,
}

#[derive(Accounts)]
pub struct BuyTokensSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserSaleState::INIT_SPACE,
        seeds = [b"user_sale_state", user.key().as_ref()],
        bump,
    )]
    pub user_sale_state: Account<'info, UserSaleState>,

    #[account(
        mut,
        seeds = [b"sale_wallet".as_ref()],
        bump,
    )]
    /// CHECK: This account will serve as a wallet for the sale, so we don't need additional checks.
    pub sale_wallet: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"sale".as_ref()],
        bump,
    )]
    pub sale: Account<'info, Sale>,

    #[account(address = Pubkey::from_str(SOL_USD_FEED).unwrap() @ SaleError::InvalidPriceFeed)]
    pub price_update: Account<'info, PriceUpdateV2>,

    pub system_program: Program<'info, System>,
}

pub fn get_sol_from_user(context: &Context<BuyTokensSol>, amount: u64) -> Result<()> {
    let transfer_sol_ix = system_program::Transfer {
        from: context.accounts.user.to_account_info().clone(),
        to: context.accounts.sale_wallet.clone(),
    };

    system_program::transfer(
        CpiContext::new(
            context.accounts.system_program.to_account_info(),
            transfer_sol_ix,
        ),
        amount,
    )
}

pub fn get_sol_price_from_oracle(price_update: &Account<PriceUpdateV2>) -> Result<i64> {
    let price = &price_update.get_price_no_older_than(
        &Clock::get()?,
        MAXIMUM_AGE,
        &get_feed_id_from_hex(FEED_ID)?,
    )?;

    Ok(price.price)
}
