use anchor_lang::prelude::*;

use crate::{error::SaleError, state::Sale};

#[derive(Accounts)]
pub struct ChangePrice<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SaleError::AccessDenied,
        seeds = [b"sale".as_ref()],
        bump,
    )]
    pub sale: Account<'info, Sale>,
}

#[derive(Accounts)]
pub struct PauseSale<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SaleError::AccessDenied,
        seeds = [b"sale".as_ref()],
        bump,
    )]
    pub sale: Account<'info, Sale>,
}

#[derive(Accounts)]
pub struct UnpauseSale<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ SaleError::AccessDenied,
        seeds = [b"sale".as_ref()],
        bump,
    )]
    pub sale: Account<'info, Sale>,
}

pub fn change_price(ctx: Context<ChangePrice>, token_price: u64) -> Result<()> {
    let sale = &mut ctx.accounts.sale;
    sale.token_price = token_price;

    Ok(())
}

pub fn pause_sale(ctx: Context<PauseSale>) -> Result<()> {
    let sale = &mut ctx.accounts.sale;
    sale.is_paused = true;

    Ok(())
}

pub fn unpause_sale(ctx: Context<UnpauseSale>) -> Result<()> {
    let sale = &mut ctx.accounts.sale;
    sale.is_paused = false;

    Ok(())
}
