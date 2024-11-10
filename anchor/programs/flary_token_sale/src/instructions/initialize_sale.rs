use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::state::Sale;

#[derive(Accounts)]
pub struct InitializeSale<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub usdt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = signer,
        space = 8 + Sale::INIT_SPACE,
        seeds = [b"sale".as_ref()],
        bump,
    )]
    pub sale: Account<'info, Sale>,

    #[account(
        init,
        payer = signer,
        space = 8,
        seeds = [b"sale_wallet".as_ref()],
        bump,
    )]
    /// CHECK: This account will serve as a wallet for the sale, so we don't need additional checks.
    pub sale_wallet: AccountInfo<'info>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = usdt_mint,
        associated_token::authority = sale,
        associated_token::token_program = token_program,
    )]
    pub usdt_storage: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn initialize_sale(
    ctx: Context<InitializeSale>,
    token_price: u64,
    usdt_mint: Pubkey,
) -> Result<()> {
    msg!("Initializing sale");
    msg!(
        "Token account {:?}",
        ctx.accounts.usdt_storage.to_account_info().key
    );

    let sale = &mut ctx.accounts.sale;
    sale.owner = *ctx.accounts.signer.key;
    sale.is_paused = false;
    sale.token_price = token_price;
    sale.usdt_mint = usdt_mint;
    sale.usdt_storage = *ctx.accounts.usdt_storage.to_account_info().key;
    sale.bump = ctx.bumps.sale;

    Ok(())
}
