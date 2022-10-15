use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};
use mpl_token_metadata::{
    instruction::{
        create_master_edition_v3, create_metadata_accounts_v3, update_metadata_accounts_v2,
    },
    state::{CollectionDetails, Creator, DataV2},
    ID as MetadataID,
};

declare_id!("EYTCQfggY21BHxGLtZBi6VYzEAxQyxu7qYkEVmDgALHT");

#[program]
pub mod nft {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        let seeds = &["auth".as_bytes(), &[*ctx.bumps.get("auth").unwrap()]];
        let signer = [&seeds[..]];

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    authority: ctx.accounts.auth.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            1, // only 1 token minted
        )?;

        let account_info = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.auth.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];

        let creator = vec![Creator {
            address: ctx.accounts.auth.key(),
            verified: false,
            share: 100,
        }];

        let collection_details = CollectionDetails::V1 { size: 0 };

        invoke_signed(
            &create_metadata_accounts_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.mint.key(),
                ctx.accounts.auth.key(),
                ctx.accounts.payer.key(),
                ctx.accounts.auth.key(), //update auth
                name,
                symbol,
                uri,
                Some(creator),
                0,
                true,
                true,
                None,
                None,
                Some(collection_details),
            ),
            account_info.as_slice(),
            &signer,
        )?;

        let master_edition_infos = vec![
            ctx.accounts.master_edition.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.auth.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ];

        invoke_signed(
            &create_master_edition_v3(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.master_edition.key(),
                ctx.accounts.mint.key(),
                ctx.accounts.auth.key(), //update auth
                ctx.accounts.auth.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.payer.key(),
                Some(0),
            ),
            master_edition_infos.as_slice(),
            &signer,
        )?;
        Ok(())
    }

    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        let seeds = &["auth".as_bytes(), &[*ctx.bumps.get("auth").unwrap()]];
        let signer = [&seeds[..]];

        let account_info = vec![
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.auth.to_account_info(),
        ];

        invoke_signed(
            &update_metadata_accounts_v2(
                ctx.accounts.token_metadata_program.key(),
                ctx.accounts.metadata.key(),
                ctx.accounts.auth.key(),
                None,
                Some(DataV2 {
                    name: name,
                    symbol: symbol,
                    uri: uri,
                    seller_fee_basis_points: 0,
                    creators: None,
                    collection: None,
                    uses: None,
                }),
                None,
                None,
            ),
            account_info.as_slice(),
            &signer,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        // seeds = ["mint".as_bytes().as_ref()],
        // bump,
        payer = payer,
        mint::decimals = 0,
        mint::authority = auth,
    )]
    pub mint: Account<'info, Mint>,
    /// CHECK: metadata account
    #[account(
        mut,
        // constraint = metadata.owner == &MetadataID
    )]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: master edition account
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    /// CHECK: mint authority
    #[account(
        seeds = ["auth".as_bytes().as_ref()],
        bump,
    )]
    pub auth: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub token_account: Account<'info, TokenAccount>,
    /// CHECK: user receiving mint
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_metadata_program: Program<'info, TokenMetaData>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    #[account(
        mut,
        // constraint = metadata.owner == &MetadataID
    )]
    /// CHECK:
    pub metadata: AccountInfo<'info>,
    /// CHECK:
    #[account(
        seeds = ["auth".as_bytes().as_ref()],
        bump,
    )]
    pub auth: UncheckedAccount<'info>,
    pub token_metadata_program: Program<'info, TokenMetaData>,
    pub payer: Signer<'info>,
}

#[derive(Clone)]
pub struct TokenMetaData;
impl anchor_lang::Id for TokenMetaData {
    fn id() -> Pubkey {
        MetadataID
    }
}
