use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::{error::SaleError, state::Sale};

#[derive(Accounts)]
pub struct WithdrawUsdt<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub usdt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = usdt_mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub signer_usdt_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        has_one = owner @ SaleError::AccessDenied,
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

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw_usdt(context: &Context<WithdrawUsdt>) -> Result<()> {
    let seeds = &[b"sale".as_ref(), &[context.accounts.sale.bump][..]];
    let signer_seeds = [&seeds[..]];

    let accounts = TransferChecked {
        from: context.accounts.usdt_storage.to_account_info(),
        to: context.accounts.signer_usdt_account.to_account_info(),
        mint: context.accounts.usdt_mint.to_account_info(),
        authority: context.accounts.sale.to_account_info(),
    };

    let cpi_context = CpiContext::new_with_signer(
        context.accounts.token_program.to_account_info(),
        accounts,
        &signer_seeds,
    );

    transfer_checked(
        cpi_context,
        context.accounts.usdt_storage.amount,
        context.accounts.usdt_mint.decimals,
    )
}
