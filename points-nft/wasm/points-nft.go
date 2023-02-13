package main

import (
	"fmt"
	"math/big"

	"github.com/tidwall/gjson"

	"github.com/machinefi/w3bstream-wasm-golang-sdk/blockchain"
	"github.com/machinefi/w3bstream-wasm-golang-sdk/log"
	"github.com/machinefi/w3bstream-wasm-golang-sdk/stream"
)

func main() {}

//export start
func _start(rid uint32) int32 {
	log.Log(fmt.Sprintf("start received: %d", rid))
	message, err := stream.GetDataByRID(rid)
	if err != nil {
		log.Log("error: " + err.Error())
		return -1
	}
	res := string(message)

	Points := gjson.Get(res, "Points")
	Account := gjson.Get(res, "Account")

	log.Log("wasm get Points from json: " + Points.String())

	if Points.Int() > 1000 {
		blockchain.SendTx(
			4690, // chain id
			"0xd6E9f94FD0247157d947fd18BfEbf204b5156d1F", //W3BStreamNFT contract address
			big.NewInt(0),
			fmt.Sprintf("6a627842000000000000000000000000%s", Account.String()),
		)
		log.Log("W3BStreamNFT has been sent to :" + Account.String())
	}

	return 0
}
