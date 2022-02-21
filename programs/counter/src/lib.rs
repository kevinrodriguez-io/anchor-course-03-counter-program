use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

const COUNTER_SEED: &[u8] = b"counter";

#[program]
pub mod counter {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>, _counter_bump: u8) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count + 1;
        Ok(())
    }

    pub fn close(_ctx: Context<CloseCounter>, _counter_bump: u8) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [COUNTER_SEED, payer.key().as_ref()],
        bump
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(counter_bump: u8)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [COUNTER_SEED, payer.key().as_ref()],
        bump = counter_bump
    )]
    pub counter: Account<'info, Counter>,
    #[account()]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(counter_bump: u8)]
pub struct CloseCounter<'info> {
    #[account(
        mut,
        close = payer,
        seeds = [COUNTER_SEED, payer.key().as_ref()],
        bump = counter_bump,
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct Counter {
    count: u64, // 8
}
