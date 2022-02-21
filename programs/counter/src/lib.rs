use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod counter {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        counter.update_authority = *ctx.accounts.update_authority.key;
        Ok(())
    }
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count + 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = update_authority)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub update_authority: Signer<'info>, // Payer
    pub system_program: Program<'info, System>, // Create Account IX (Counter)
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = update_authority)]
    pub counter: Account<'info, Counter>,
    #[account()]
    pub update_authority: Signer<'info>, // Payer
}

#[account]
#[derive(Default)]
pub struct Counter {
    count: u64,               // 8
    update_authority: Pubkey, // 32
}
