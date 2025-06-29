// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UsernameManager  {
    mapping(address => string) public usernames;
    mapping(string => bool) public usedNames;

    function setUsername(string memory _name) public {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(!usedNames[_name], "Name already in use");

        // Nếu đã đặt trước đó thì bỏ tên cũ khỏi danh sách
        string memory currentName = usernames[msg.sender];
        if (bytes(currentName).length > 0) {
            usedNames[currentName] = false;
        }

        usernames[msg.sender] = _name;
        usedNames[_name] = true;
    }

}
