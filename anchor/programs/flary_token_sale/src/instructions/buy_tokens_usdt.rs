use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::state::{Sale, UserSaleState};

use super::transfer_tokens;

#[derive(Accounts)]
pub struct BuyTokensUsdt<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub usdt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = sale.usdt_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub signer_usdt_account: InterfaceAccount<'info, TokenAccount>,

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
        seeds = [b"sale".as_ref()],
        bump,
    )]
    pub sale: Account<'info, Sale>,

    #[account(
        mut,
        associated_token::mint = sale.usdt_mint,
        associated_token::authority = sale,
        associated_token::token_program = token_program,
    )]
    pub usdt_storage: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn get_tokens_from_user(context: &Context<BuyTokensUsdt>, amount: u64) -> Result<()> {
    transfer_tokens(
        &context.accounts.signer_usdt_account,
        &context.accounts.usdt_storage,
        &amount,
        &context.accounts.usdt_mint,
        &context.accounts.user,
        &context.accounts.token_program,
    )
}
