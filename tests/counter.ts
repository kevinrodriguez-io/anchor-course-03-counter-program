import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { TextEncoder } from "util";
import { Counter } from "../target/types/counter";

const b = (input: TemplateStringsArray) =>
  new TextEncoder().encode(input.join(""));

describe("counter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Counter as Program<Counter>;
  const localWallet = anchor.Wallet.local();

  let counterKey: anchor.web3.PublicKey | null = null;
  let counterBump: number | null = null;

  it("initializes the counter", async () => {
    const [derivedAddress, bump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [b`counter`, localWallet.publicKey.toBytes()],
        program.programId
      );
    counterKey = derivedAddress;
    counterBump = bump;

    const _tx = await program.rpc.initialize({
      accounts: {
        counter: counterKey,
        payer: localWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [localWallet.payer],
    });
    const counter = await program.account.counter.fetch(counterKey);
    expect(new anchor.BN(0).eq(counter.count)).to.be.true;
  });

  it("increases the counter", async () => {
    expect(counterKey).not.to.be.null;
    const _tx = await program.rpc.increment(counterBump, {
      accounts: {
        counter: counterKey,
        payer: localWallet.publicKey,
      },
      signers: [localWallet.payer],
    });
    const counter = await program.account.counter.fetch(counterKey);
    expect(new anchor.BN(1).eq(counter.count)).to.be.true;
  });

  it("fails if we try to increase the counter as someone else", async () => {
    const otherWallet = anchor.web3.Keypair.generate();
    expect(
      program.rpc.increment(counterBump, {
        accounts: {
          counter: counterKey,
          payer: localWallet.publicKey,
        },
        signers: [otherWallet],
      })
    ).to.throw;
  });

  it("closes the counter", async () => {
    expect(counterKey).not.to.be.null;
    const _tx = await program.rpc.close(counterBump, {
      accounts: {
        counter: counterKey,
        payer: localWallet.publicKey,
      },
      signers: [localWallet.payer],
    });
    const counter = await program.account.counter.fetchNullable(counterKey);
    expect(counter).to.be.null;
  });
});
