package main

import (
	"fmt"

	"github.com/tidwall/gjson"
	
	common "github.com/machinefi/w3bstream/_examples/wasm_common_go"
)

func main() {}

//export start
func _start(rid uint32) int32 {
	common.Log(fmt.Sprintf("start received: %d", rid))
	message, err := common.GetDataByRID(rid)
	if err != nil {
		common.Log("error: " + err.Error())
		return -1
	}
	res := string(message)

	Points := gjson.Get(res, "Points")
	Account := gjson.Get(res,"Account")

	common.Log("wasm get Points from json: " + Points.String())

	if Points.Int() > 1000 {
		common.SendTx(fmt.Sprintf(
			`{
				"to": "%s",
				"value": "0",
				"data": "6a627842000000000000000000000000%s"
			}`,
			"0xd6E9f94FD0247157d947fd18BfEbf204b5156d1F",//W3BStreamNFT contract address
			Account.String(),
			
		))
		common.Log("W3BStreamNFT has been sent to :" + Account.String())
	}

	return 0
}