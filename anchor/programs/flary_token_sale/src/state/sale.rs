use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Sale {
    pub owner: Pubkey,
    pub is_paused: bool,
    pub token_price: u64,
    pub usdt_mint: Pubkey,
    pub usdt_storage: Pubkey,
    pub bump: u8,
}
