// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./AdminManager.sol";
contract BookCategory is AdminManager {

    struct Category{
        uint id;
        string name;
        bool isDeleted;
    }

    Category[] public allCategories;
    mapping(string => bool) private existingNames;


    // 🟡 Thêm thể loại (chỉ admin)
    function addCategory(string memory newCategory) public onlyAdmin {
        require(!existingNames[newCategory], "Category already exists");

        uint categoryId = allCategories.length;
        allCategories.push(Category(categoryId, newCategory, false));
        existingNames[newCategory] = true;
    }

    function getAllCategories() public view returns (Category[] memory) {
        // Đếm số lượng chưa xoá
        uint count = 0;
        for (uint i = 0; i < allCategories.length; i++) {
            if (!allCategories[i].isDeleted) count++;
        }

        // Tạo mảng mới chứa kết quả
        Category[] memory activeCategories = new Category[](count);
        uint index = 0;
        for (uint i = 0; i < allCategories.length; i++) {
            if (!allCategories[i].isDeleted) {
                activeCategories[index] = allCategories[i];
                index++;
            }
        }

        return activeCategories;
    }


    function deleteCategory(uint categoryId) public onlyAdmin {
        require(categoryId < allCategories.length, "Invalid category ID");
        require(!allCategories[categoryId].isDeleted, "Category already deleted");

        allCategories[categoryId].isDeleted = true;
        existingNames[allCategories[categoryId].name] = false; // cho phép thêm lại tên đó nếu muốn
    }
    
}
