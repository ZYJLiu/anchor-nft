import * as anchor from "@project-serum/anchor"
import { Program } from "@project-serum/anchor"
import { Keypair } from "@solana/web3.js"
import { Nft } from "../target/types/nft"
import { getAccount, getAssociatedTokenAddressSync } from "@solana/spl-token"
import {
  findMasterEditionV2Pda,
  findMetadataPda,
} from "@metaplex-foundation/js"
import { CollectionDetails } from "@metaplex-foundation/mpl-token-metadata"

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

  const update = {
    uri: "https://arweave.net/x1ij5-YMqJEVthZqCIIG7Gs2C_zdxMQuzmcGxKUJ8tU",
    name: "Update",
    symbol: "UPDATE",
  }

  const [auth] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("auth")],
    program.programId
  )

  const mint = Keypair.generate()
  const mint2 = Keypair.generate()

  it("Create Collection NFT", async () => {
    const metadataPDA = await findMetadataPda(mint.publicKey)
    const masterEditionPDA = await findMasterEditionV2Pda(mint.publicKey)

    const tokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey
    )

    // const collectionDetails = {
    //   V1: {
    //     size: 0,
    //   } as CollectionDetails,
    // }

    // const collection = null

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

  it("Create NFT in Collection", async () => {
    const metadataPDA = await findMetadataPda(mint2.publicKey)
    const masterEditionPDA = await findMasterEditionV2Pda(mint2.publicKey)
    const collectionMetadataPDA = await findMetadataPda(mint.publicKey)
    const collectionMasterEditionPDA = await findMasterEditionV2Pda(
      mint.publicKey
    )

    const tokenAccount = getAssociatedTokenAddressSync(
      mint2.publicKey,
      provider.wallet.publicKey
    )

    // const collectionDetails = {
    //   V1: {
    //     size: 0,
    //   } as CollectionDetails,
    // }

    // const collection = null

    // Add your test here.
    const tx = await program.methods
      .createNft(nft.uri, nft.name, nft.symbol)
      .accounts({
        mint: mint2.publicKey,
        metadata: metadataPDA,
        masterEdition: masterEditionPDA,
        collectionMint: mint.publicKey,
        collectionMetadata: collectionMetadataPDA,
        collectionMasterEdition: collectionMasterEditionPDA,
        auth: auth,
        tokenAccount: tokenAccount,
        user: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .signers([mint2])
    const keys = await tx.pubkeys()
    // console.log(keys)
    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )

    const account = await getAccount(provider.connection, tokenAccount)
    console.log(account.amount)
  })

  it("Update Collection NFT Metadata", async () => {
    const metadataPDA = await findMetadataPda(mint.publicKey)
    console.log(mint.publicKey.toString())
    // Add your test here.
    const tx = await program.methods
      .updateMetadata(update.uri, update.name, update.symbol)
      .accounts({
        metadata: metadataPDA,
        auth: auth,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
    const keys = await tx.pubkeys()
    // console.log(keys)
    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
  })

  it("Update NFT in Collection Metadata", async () => {
    const metadataPDA = await findMetadataPda(mint2.publicKey)
    console.log(mint2.publicKey.toString())

    // Add your test here.
    const tx = await program.methods
      .updateMetadata(update.uri, update.name, update.symbol)
      .accounts({
        metadata: metadataPDA,
        auth: auth,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
    const keys = await tx.pubkeys()
    // console.log(keys)
    const transactionSignature = await tx.rpc()
    console.log(
      `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
  })
})
