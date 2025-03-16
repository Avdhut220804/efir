
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ComplaintRegistry {
    struct Complaint {
        string firId;
        string evidenceHash;
        string metadataHash;
        string status;
        address reporter;
        uint256 timestamp;
    }

    mapping(string => Complaint) public complaints;
    string[] public complaintIds;

    event ComplaintFiled(string firId, address reporter);
    event StatusUpdated(string firId, string status);

    function fileComplaint(
        string memory _firId,
        string memory _evidenceHash,
        string memory _metadataHash
    ) public {
        require(complaints[_firId].reporter == address(0), "FIR already exists");
        
        complaints[_firId] = Complaint({
            firId: _firId,
            evidenceHash: _evidenceHash,
            metadataHash: _metadataHash,
            status: "FILED",
            reporter: msg.sender,
            timestamp: block.timestamp
        });
        
        complaintIds.push(_firId);
        emit ComplaintFiled(_firId, msg.sender);
    }

    function updateStatus(string memory _firId, string memory _status) public {
        require(complaints[_firId].reporter != address(0), "FIR does not exist");
        complaints[_firId].status = _status;
        emit StatusUpdated(_firId, _status);
    }

    function getComplaint(string memory _firId) public view returns (
        string memory evidenceHash,
        string memory metadataHash,
        string memory status,
        address reporter,
        uint256 timestamp
    ) {
        Complaint memory complaint = complaints[_firId];
        return (
            complaint.evidenceHash,
            complaint.metadataHash,
            complaint.status,
            complaint.reporter,
            complaint.timestamp
        );
    }
}
