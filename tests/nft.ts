import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { Keypair } from "@solana/web3.js"
import { Nft } from "../target/types/nft"
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token"
import {
  findMasterEditionV2Pda,
  findMetadataPda,
} from "@metaplex-foundation/js"

describe("nft", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Nft as Program<Nft>

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  )
  const nft = {
    uri: "https://arweave.net/bj7vXx6-AmFV0lk0QlCOGk1O9aCDoJAqefg55107rT4",
    name: "NAME",
    symbol: "SYMBOL",
  }

  const [auth] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("auth")],
    program.programId
  )

  it("Is initialized!", async () => {
    const mint = Keypair.generate()
    const metadataPDA = await findMetadataPda(mint.publicKey)
    const masterEditionPDA = await findMasterEditionV2Pda(mint.publicKey)

    const tokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey
    )

    // Add your test here.
    const tx = await program.methods
      .initialize(nft.uri, nft.name, nft.symbol)
      .accounts({
        mint: mint.publicKey,
        metadata: metadataPDA,
        masterEdition: masterEditionPDA,
        auth: auth,
        tokenAccount: tokenAccount,
        user: provider.wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([mint])
    const keys = await tx.pubkeys()
    // console.log(keys)
    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const account = await getAccount(provider.connection, tokenAccount)
    console.log(account.amount)
  })
})
