use anchor_lang::prelude::*;

use crate::{error::SaleError, state::Sale};

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

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

    pub system_program: Program<'info, System>,
}

pub fn withdraw_sol(context: &Context<WithdrawSol>) -> Result<()> {
    msg!("Owner: {:?}", context.accounts.owner.key());
    msg!("Sale wallet: {:?}", context.accounts.sale_wallet.key());

    if &context.accounts.owner.key() != &context.accounts.sale.owner {
        return Err(SaleError::AccessDenied.into());
    }

    let rent = Rent::get().unwrap();
    let rent_lamports = rent.minimum_balance(context.accounts.sale_wallet.data_len());

    let lamports = context.accounts.sale_wallet.lamports() - rent_lamports;

    **context.accounts.sale_wallet.try_borrow_mut_lamports()? -= lamports;
    **context.accounts.owner.try_borrow_mut_lamports()? += lamports;

    Ok(())
}
