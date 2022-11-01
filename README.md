# W3BStream Examples

![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)

### This project is a collection of w3bstream example projects, through which you can quickly learn how to develop dapp on w3bstream

## Contents
-  [click2earn](https://github.com/machinefi/w3bstream-examples/tree/main/click2earn/)
-  [device-proof](https://github.com/machinefi/w3bstream-examples/tree/main/device-proof/)


## Technology stack
 - wasm
 - Arduino/C++
 - MQTT/HTTP
 
## Associated project
 -  [w3bstream](https://github.com/iotexproject/w3bstream)
 -  [spoon](https://spoon.dapp.works/)

## Get Start
  First, you need to follow the [w3bstream](https://github.com/iotexproject/w3bstream) tutorial to start a docker container locally.
  You need to add your private key to the configuration file before packaging the image in `cmd/srv-applet-mgr/config/local.yml `
  
  `local.yml`
  
  ```yml
  SRV_APPLET_MGR__ETHCLIENTCONFIG__PrivateKey: <YOUR PRIVATE KEY>
  ```

  After you start the mirror locally, the preparatory work can be completed. Here are the detailed tutorials for each project.
  - [device-proof](https://github.com/machinefi/w3bstream-examples/blob/main/device-proof/README.md)
  - [click2earn](https://github.com/machinefi/w3bstream-examples/tree/main/click2earn/)
  
  ## Development Planning
  Our Development is fully tracked on this public Roadmap 🎉

  For even more information you can take a look at ... 🔔
  
  > 🚧 This document is work-in progress 🚧
  > The documents under this section are subject to frequent changes. 
  > Please come back to check on the status of this page at a later date. 
