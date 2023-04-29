import { SendTx } from "@w3bstream/wasm-sdk";
import { log } from "./utils";

// Calls a standard, mintable ERC20 contract to mint rewards to a recipient
export function mintRewards(
    token_contract: string,
    recipient: string,
    amountHexStr: string
  ): string {
    const amountStr = "0".repeat(64 - amountHexStr.length) + amountHexStr;
    const recipientStr = recipient.replace("0x","");
    const data: string = `0x40c10f19000000000000000000000000${recipientStr}${amountStr}`;
    log("Sending tx data: "+ data);
    const res = SendTx(4690, token_contract,"0",data);
    log("Mint rewards hash:" + res);
    return res;
  }