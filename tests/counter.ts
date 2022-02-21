import * as anchor from "@project-serum/anchor";
import { ACCOUNT_DISCRIMINATOR_SIZE, Program } from "@project-serum/anchor";
import { expect } from "chai";
import { Counter } from "../target/types/counter";

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Counter as Program<Counter>;
  const localWallet = anchor.Wallet.local();

  let counterKeypair: anchor.web3.Keypair | null = null;
  it("initializes the counter", async () => {
    counterKeypair = anchor.web3.Keypair.generate();
    // Add your test here.
    const tx = await program.rpc.initialize({
      accounts: {
        counter: counterKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        updateAuthority: localWallet.publicKey,
      },
      signers: [localWallet.payer, counterKeypair],
    });
    console.log("Your transaction signature", tx);
    const counter = await program.account.counter.fetch(
      counterKeypair.publicKey
    );
    expect(new anchor.BN(0).eq(counter.count)).to.be.true;
    expect(counter.updateAuthority.equals(localWallet.publicKey)).to.be.true;
  });

  it("increases the counter", async () => {
    expect(counterKeypair).not.to.be.null;
    const tx = await program.rpc.increment({
      accounts: {
        counter: counterKeypair.publicKey,
        updateAuthority: localWallet.publicKey,
      },
      signers: [localWallet.payer],
    });
    console.log("Your transaction signature", tx);
    const counter = await program.account.counter.fetch(
      counterKeypair.publicKey
    );
    expect(new anchor.BN(1).eq(counter.count)).to.be.true;
    expect(counter.updateAuthority.equals(localWallet.publicKey)).to.be.true;
  });

  it("fails if we try to increase the counter as someone else", async () => {
    const otherWallet = anchor.web3.Keypair.generate();
    expect(
      program.rpc.increment({
        accounts: {
          counter: counterKeypair.publicKey,
          updateAuthority: otherWallet.publicKey,
        },
        signers: [otherWallet],
      })
    ).to.throw;
  });

  // We spotted a design flow:
  // There can be more than two counter instances for that user!!!!!!!!!
  it("counter accounts should be 1", async () => {
    const counters = await program.account.counter.all([
      {
        memcmp: {
          offset: ACCOUNT_DISCRIMINATOR_SIZE + 8, // u64 counter
          bytes: localWallet.publicKey.toBase58(),
        },
      },
    ]);
    console.log(counters);
    expect(counters?.[0]?.account?.count).not.to.be.undefined;
    expect(counters.length).to.be.eq(1);
  });

  it("initializes another counter", async () => {
    const anotherCounterKeypair = anchor.web3.Keypair.generate();
    // Add your test here.
    const tx = await program.rpc.initialize({
      accounts: {
        counter: anotherCounterKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        updateAuthority: localWallet.publicKey,
      },
      signers: [localWallet.payer, anotherCounterKeypair],
    });
    console.log("Your transaction signature", tx);
    const counter = await program.account.counter.fetch(
      anotherCounterKeypair.publicKey
    );
    expect(new anchor.BN(0).eq(counter.count)).to.be.true;
    expect(counter.updateAuthority.equals(localWallet.publicKey)).to.be.true;
  });

  // We spotted a design flow:
  // There can be more than two counter instances for that user!!!!!!!!!
  it("counter accounts should still be 1", async () => {
    const counters = await program.account.counter.all([
      {
        memcmp: {
          offset: ACCOUNT_DISCRIMINATOR_SIZE + 8, // u64 counter
          bytes: localWallet.publicKey.toBase58(),
        },
      },
    ]);
    console.log(counters);
    expect(counters?.[0]?.account?.count).not.to.be.undefined;
    expect(counters.length).to.be.eq(1);
  });
});
