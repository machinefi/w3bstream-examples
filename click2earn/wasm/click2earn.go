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

	Account := gjson.Get(res,"Account")
	count := common.GetDB("clicks") + 1

	common.SetDB("clicks", count)

	if count%5 == 0 {
		common.SendTx(fmt.Sprintf(
			`{
				"to": "%s",
				"value": "0",
				"data": "40c10f19000000000000000000000000%s0000000000000000000000000000000000000000000000000de0b6b3a7640000"
			}`,
			"0xb73eE6EB5b1984c78CCcC49eA7Ad773E71d74F51",//W3BERC20 contract address
			Account.String(),//send to account 
		))
		common.Log("send tx")
	}

	return 0
}