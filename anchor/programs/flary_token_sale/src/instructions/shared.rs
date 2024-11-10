use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{
    error::SaleError,
    state::{Sale, UserSaleState},
};

pub fn transfer_tokens<'info>(
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    amount: &u64,
    mint: &InterfaceAccount<'info, Mint>,
    authority: &Signer<'info>,
    token_program: &Interface<'info, TokenInterface>,
) -> Result<()> {
    let transfer_accounts_options = TransferChecked {
        from: from.to_account_info(),
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: authority.to_account_info(),
    };

    let cpi_context = CpiContext::new(token_program.to_account_info(), transfer_accounts_options);

    transfer_checked(cpi_context, *amount, mint.decimals)
}

pub fn error_if_paused(sale: &Sale) -> Result<()> {
    if sale.is_paused {
        return Err(SaleError::SaleIsPaused.into());
    }

    Ok(())
}

pub fn increase_token_amount(
    user_sale_state: &mut Account<UserSaleState>,
    token_amount: u64,
) -> Result<()> {
    user_sale_state.token_amount += token_amount;

    Ok(())
}
