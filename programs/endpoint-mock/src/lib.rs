pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;
use state::*;

declare_id!("BWGW2dJsDXtDBeZ9eK6ib65yyypbXeLzZb9iwm6EGyim");

pub const OAPP_SEED: &[u8] = b"OApp";

#[program]
pub mod endpoint {
    use super::*;

    pub fn register_oapp(mut ctx: Context<RegisterOApp>, params: RegisterOAppParams) -> Result<()> {
        RegisterOApp::apply(&mut ctx, &params)
    }
}
