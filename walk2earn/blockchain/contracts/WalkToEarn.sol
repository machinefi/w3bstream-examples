// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import "./DeviceBinding.sol";
import "./StepToken.sol";

contract WalkToEarn is Ownable {
    using Counters for Counters.Counter;
    
    uint16 public REQUEST_TIMEOUT_SECONDS = 60;
    // As an incentive, we can start with rewarding 1 token for each valid 
    // step walked. Should be lowered over time.
    uint public REWARDS_FACTOR;

    Counters.Counter private _currentReqId;

    DeviceBinding private _deviceBindingContract;
    StepToken private _stepTokenContract;
      
    struct PendingRequest {
        uint256 id;
        address deviceOwner;
        address deviceId;
        uint256 fromTime;
        uint256 toTime; // This also is the time when the request is created.
    }
    
    // Keep track of all requests waiting for a reply from W3bStream
    mapping (uint => PendingRequest) PendingRequests;
    
    struct User {
        uint256 lastClaimedTime;
        uint256 balance;
        uint256 pendingRequestId;
        bool hasPendingRequest;
    }

    // Keep track of every user's unclaimed balance 
    // and their last claimed time
    mapping (address => User) Users;

    // This event serves as a request for walking activity
    event ActivityRequested (
        uint256 _requestId, 
        address _userAddress,
        address _deviceId, 
        uint256 _fromTime, 
        uint256 _toTime); 

    constructor(address _deviceBindingContractAddress, address _stepTokenAddress) {
        console.log("Deploying WalkToEarn contract");
        _deviceBindingContract = DeviceBinding(_deviceBindingContractAddress);
        _stepTokenContract = StepToken(_stepTokenAddress);
        setRewardsFactor(10 ** _stepTokenContract.decimals());
    }

    // Attempt to claim rewards for walking activity for a specific device
    // We specify the device here to make things simpler: we could
    // just have w3bstream extract all devices owned by the user and return
    // aggergated rewards.
    function claimActivityRequest(address _deviceId) public returns (bool) {
        // Let's ignore any request from accounts that do not own a device
        address[] memory ownedDevices = _deviceBindingContract.getOwnedDevices(msg.sender);
        require(ownedDevices.length > 0, "no devices owned"); 
        bool isDeviceOwned = false;
        for (uint i=0; i<ownedDevices.length; i++) {
            if (ownedDevices[i] == _deviceId) {
                isDeviceOwned = true;
                break;
            }
        }
        require(isDeviceOwned, "device not owned");
        // One request at a time per user
        if (Users[msg.sender].hasPendingRequest) {
            uint256 lastRequest = Users[msg.sender].pendingRequestId;        
            require(isExpiredRequest(lastRequest), "already have a pending request");
            delete PendingRequests[lastRequest]; // Remove the expired request
        }
        // Emit a new W3bStream request to get an index of user's walking activity
        // from last claim time to current time
        uint256 reqId = _currentReqId.current();        
        uint256 lastClaimedTime = Users[msg.sender].lastClaimedTime;
       
        // Create a pending request for later processing        
        PendingRequest memory req = 
            PendingRequest(reqId, msg.sender, _deviceId, lastClaimedTime, block.timestamp);
        
        PendingRequests[reqId] = req;
        Users[msg.sender].pendingRequestId = reqId;
        Users[msg.sender].hasPendingRequest = true;
        // Emit the request to W3bStream
        emit ActivityRequested(req.id,  req.deviceOwner, req.deviceId, req.fromTime, req.toTime);

        _currentReqId.increment();
        return true;
    }

    // This function is called by W3bStream when a user's walking activity 
    // has been requested by the contract. We only want W3bStream to reply, 
    // for simplicity we assume the w3bstream server is the owner of this contract
    function claimActivityReply(
        uint256 _requestId, uint steps, bool _success, string memory _error) 
        public onlyOwner {        
        // Revert if there is no matching request pending (the server should 
        // use getPendingRequest to check if the request has been fulfilled)
        require(isPendingRequest(_requestId), "no pending request with this id (or it's expired)");
        // Revert on W3bstream failure
        require(_success, _error);
        // If all good, W3bStream returned the number of steps walked that are
        // worth of rewards. Let's update the user's balance accordingly.
        Users[PendingRequests[_requestId].deviceOwner].balance += steps * REWARDS_FACTOR;
        Users[PendingRequests[_requestId].deviceOwner].lastClaimedTime = 
            PendingRequests[_requestId].toTime;
        // Request fulfilled, remove it from the pending requests list
        Users[PendingRequests[_requestId].deviceOwner].hasPendingRequest = false;
        delete PendingRequests[_requestId];
    }

    function claimRewards() public payable {
        require(Users[msg.sender].balance > 0, "no activity");
        
        uint balanceToTransfer = Users[msg.sender].balance;
        Users[msg.sender].balance = 0;
        _stepTokenContract.transfer(msg.sender, balanceToTransfer);
    }

    // Check if a request is pending
    function isPendingRequest(uint256 _reqId) public view returns (bool) {
        if (PendingRequests[_reqId].deviceOwner == address(0)) return false;

        return 
            (block.timestamp - PendingRequests[_reqId].toTime)
            < REQUEST_TIMEOUT_SECONDS; // request is not expired
    }

    function isExpiredRequest(uint256 _reqId) public view returns (bool) {
        return !isPendingRequest(_reqId);
    }

    function getPendingRequest(uint256 _reqId) public view returns (PendingRequest memory) {
        if (isPendingRequest(_reqId)) {
            return PendingRequests[_reqId];
        }

        return PendingRequest(0, address(0), address(0), 0, 0);
    }

    function getUserSteps(address _userAddress) public view returns (uint256) {
        return Users[_userAddress].balance;
    }

    function getUserLastClaimedTime(address _userAddress) public view returns (uint256) {
        return Users[_userAddress].lastClaimedTime;
    }

    function setRequestTimeout(uint16 _timeout) public onlyOwner {
        REQUEST_TIMEOUT_SECONDS = _timeout;
    }

    function getRequestTimeout() public view returns (uint32) {
        return REQUEST_TIMEOUT_SECONDS;
    }

    function setRewardsFactor(uint _factor) public onlyOwner {
        REWARDS_FACTOR = _factor;
    }

    function getRewardsFactor() public view returns (uint) {
        return REWARDS_FACTOR;
    }

    function getBalance() public view returns (uint256) {
        return _stepTokenContract.balanceOf(address(this));
    }
}

