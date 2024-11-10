pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;

declare_id!("2EBs8GKZGfrnQSdhQfHmxa1Mik2UgGXRV6kRjS4h8G8T");

#[program]
pub mod flary_token_sale {
    use super::*;

    pub fn initialize_sale(
        context: Context<InitializeSale>,
        token_price: u64,
        usdt_mint: Pubkey,
    ) -> Result<()> {
        msg!(
            "Initializing sale, sale wallet: {}",
            context.accounts.sale_wallet.key()
        );
        instructions::initialize_sale::initialize_sale(context, token_price, usdt_mint)
    }

    pub fn change_price(ctx: Context<ChangePrice>, token_price: u64) -> Result<()> {
        instructions::admin::change_price(ctx, token_price)
    }

    pub fn pause_sale(ctx: Context<PauseSale>) -> Result<()> {
        msg!("Pausing sale");

        instructions::admin::pause_sale(ctx)
    }

    pub fn unpause_sale(ctx: Context<UnpauseSale>) -> Result<()> {
        msg!("Unpausing sale");

        instructions::admin::unpause_sale(ctx)
    }

    pub fn buy_tokens_usdt(ctx: Context<BuyTokensUsdt>, amount: u64) -> Result<()> {
        let sale = &ctx.accounts.sale;

        msg!("Buying tokens");

        let user_sale_state = &mut ctx.accounts.user_sale_state;

        if user_sale_state.user == Pubkey::default() {
            user_sale_state.user = ctx.accounts.user.key();
        } else if user_sale_state.user != ctx.accounts.user.key() {
            return Err(error::SaleError::AccessDenied.into());
        }

        instructions::shared::error_if_paused(sale)?;
        instructions::buy_tokens_usdt::get_tokens_from_user(&ctx, amount)?;

        let token_amount = amount * 10u64.pow(9) / sale.token_price;

        instructions::shared::increase_token_amount(&mut ctx.accounts.user_sale_state, token_amount)
    }

    pub fn buy_tokens_sol(ctx: Context<BuyTokensSol>, amount: u64) -> Result<()> {
        let sale = &ctx.accounts.sale;

        msg!("Buying tokens");

        let user_sale_state = &mut ctx.accounts.user_sale_state;

        if user_sale_state.user == Pubkey::default() {
            user_sale_state.user = ctx.accounts.user.key();
        } else if user_sale_state.user != ctx.accounts.user.key() {
            return Err(error::SaleError::AccessDenied.into());
        }

        instructions::shared::error_if_paused(sale)?;

        instructions::buy_tokens_sol::get_sol_from_user(&ctx, amount)?;

        let sol_price =
            instructions::buy_tokens_sol::get_sol_price_from_oracle(&ctx.accounts.price_update)?;

        msg!("Sol price: {}", sol_price);

        let token_amount = amount * sol_price.unsigned_abs() / (sale.token_price * 10u64.pow(2));

        msg!("Token amount: {}", token_amount);

        instructions::shared::increase_token_amount(&mut ctx.accounts.user_sale_state, token_amount)
    }

    pub fn withdraw_usdt(ctx: Context<WithdrawUsdt>) -> Result<()> {
        instructions::withdraw_usdt::withdraw_usdt(&ctx)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>) -> Result<()> {
        instructions::withdraw_sol::withdraw_sol(&ctx)
    }
}
