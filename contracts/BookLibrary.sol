// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AdminManager.sol";
import "./UsernameManager.sol";

contract BookLibrary is AdminManager, UsernameManager {
    enum BookStatus { Available, Borrowed }

    struct BorrowInfo {
        address borrower;
        uint returnDate;
    }

    struct Book {
        uint id;
        string title;
        address owner;
        uint price;
        string description; // Thêm mô tả
        uint[] categoryIds;
        string ipfsHash;
        string coverImageHash;
        BookStatus status;
        BorrowInfo[] borrows;
        bool isDeleted;
        address performedBy;
    }

    uint public nextId;
    mapping(uint => Book) public books;
    mapping(string => bool) internal usedTitles;

    event BookAdded(uint id, string title, uint[] categoryIds, string ipfsHash, uint price, address owner);
    event BookEdited(uint indexed id, string title, uint price, uint[] categoryIds, address performedBy);
    event BookDeleted(uint indexed id, address performedBy);

    // -------- Book Management --------
    function addBook(string memory _title, uint[] memory _categoryIds, string memory _ipfsHash, string memory _coverImageHash, uint _price, string memory _description) public onlyAdmin {
        require(!usedTitles[_title], "Book title already exists");
        require(bytes(usernames[msg.sender]).length > 0, "You must set your username first");

        Book storage newBook = books[nextId];
        newBook.id = nextId;
        newBook.title = _title;
        newBook.categoryIds = _categoryIds; // Lưu thể loại sách
        newBook.ipfsHash = _ipfsHash;
        newBook.coverImageHash = _coverImageHash;
        newBook.price = _price;
        newBook.description = _description; // Lưu mô tả sách
        newBook.owner = msg.sender; // chỉ lưu địa chỉ, không lưu tên
        newBook.status = BookStatus.Available;
        newBook.isDeleted = false;
        newBook.performedBy = msg.sender;
        usedTitles[_title] = true;

        emit BookAdded(nextId, _title, _categoryIds, _ipfsHash, _price, msg.sender); // bỏ author string
        nextId++;
    }

    function editBook(uint _id, string memory _title, uint[] memory _categoryIds, string memory _ipfsHash, string memory _coverImageHash, uint _price, string memory _description) public onlyAdmin {
            require(_id < nextId, "Book does not exist");

            Book storage book = books[_id];

            // Chỉ người tạo sách hoặc super admin được sửa
            require(
                book.owner == msg.sender || msg.sender == getRoleMember(DEFAULT_ADMIN_ROLE, 0),
                "You are not allowed to edit this book"
            );

            if (keccak256(bytes(book.title)) != keccak256(bytes(_title))) {
                require(!usedTitles[_title], "New title already exists");

                usedTitles[book.title] = false;
                usedTitles[_title] = true;
                book.title = _title;
            }

            book.price = _price;
            book.coverImageHash = _coverImageHash;
            book.ipfsHash = _ipfsHash;
            book.description = _description; // Cập nhật mô tả sách
            book.categoryIds = _categoryIds; // Cập nhật thể loại sách

            emit BookEdited(_id, book.title, book.price, book.categoryIds , msg.sender);
        }

    function isTitleUsed(string memory _title) public view returns (bool) {
        return usedTitles[_title];
    }
    
    function deleteBook(uint bookId) public onlyAdmin {
        require(bookId < nextId, "Invalid book ID");
        Book storage book = books[bookId];
        require(!book.isDeleted, "Book already deleted");

        usedTitles[book.title] = false;
        book.isDeleted = true;

        emit BookDeleted(bookId, msg.sender);
    }

    function getAllBooks() public view returns (Book[] memory) {
        uint count = 0;
        for (uint i = 0; i < nextId; i++) {
            if (!books[i].isDeleted) count++;
        }

        Book[] memory result = new Book[](count);
        uint index = 0;

        for (uint i = 0; i < nextId; i++) {
            if (!books[i].isDeleted) {
                result[index] = books[i];
                index++;
            }
        }

        return result;
    }
    
}
