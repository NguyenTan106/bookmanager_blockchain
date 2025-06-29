// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./BookLibrary.sol";

contract BorrowManager is BookLibrary {
    event BookBorrowed(uint indexed id, address indexed borrower, uint returnDate);
    event BookPurchased(uint indexed id, address indexed buyer, uint price);
    event BookReturned(uint id, string title, address performedBy);

    mapping(uint => mapping(address => bool)) public bookPurchases;

    function buyBook(uint _id) public payable {
        require(_id < nextId, "Book does not exist");

        Book storage book = books[_id];
        require(!book.isDeleted, "Book has been deleted");
        // require(msg.value == book.price, "Incorrect payment amount");

        // Ghi lại người mua
        bookPurchases[_id][msg.sender] = true;

        // Trả tiền cho tác giả
        payable(book.owner).transfer(msg.value);
        book.status = BookStatus.Borrowed;

        emit BookPurchased(_id, msg.sender, msg.value);
    }


    function hasPurchasedBooks(address user) public view returns (bool) {
        for (uint i = 0; i < nextId; i++) {
            if (bookPurchases[i][user]) {
                return true;
            }
        }
        return false;
    }

    function borrowBook(uint _id, uint durationDays) public payable {
        Book storage book = books[_id];
        require(!book.isDeleted, "Book is deleted");

        for (uint i = 0; i < book.borrows.length; i++) {
            require(book.borrows[i].borrower != msg.sender, "You already borrowed");
        }

        // Check payment
        require(msg.value >= book.price, "Not enough ETH sent");

        // Trả cho người tạo sách
        payable(book.owner).transfer(msg.value);

        uint returnDate = block.timestamp + durationDays * 1 days;
        book.borrows.push(BorrowInfo(msg.sender, returnDate));
        book.status = BookStatus.Borrowed;

        emit BookBorrowed(_id, msg.sender, returnDate);
    }

    function hasBorrowedBooks(address user) public view returns (bool) {
        for (uint i = 0; i < nextId; i++) {
            Book storage book = books[i];
            for (uint j = 0; j < book.borrows.length; j++) {
                if (book.borrows[j].borrower == user) {
                    return true;
                }
            }
        }
        return false;
    }

        function revokeBook(uint bookId) public onlyAdmin {
        require(bookId < nextId, "Book does not exist");
        require(books[bookId].status == BookStatus.Borrowed, "Book is not borrowed");

        delete books[bookId].borrows;
        books[bookId].status = BookStatus.Available;

        emit BookReturned(bookId, books[bookId].title, msg.sender);
    }
    function revokeSingleBorrower(uint _bookId, address _borrower) public onlyRole(ADMIN_ROLE) {
        Book storage book = books[_bookId];
        require(book.status == BookStatus.Borrowed, "Book is not borrowed.");

        uint index = type(uint).max;
        for (uint i = 0; i < book.borrows.length; i++) {
            if (book.borrows[i].borrower == _borrower) {
                index = i;
                break;
            }
        }
        require(index != type(uint).max, "Borrower not found.");

        // Xoá người mượn khỏi mảng
        book.borrows[index] = book.borrows[book.borrows.length - 1];
        book.borrows.pop();

        // Nếu không còn ai mượn => trạng thái trở lại Available
        if (book.borrows.length == 0) {
            book.status = BookStatus.Available;
        }
    }
      


    function returnBook(uint _id) public {
        Book storage book = books[_id];
        uint index = type(uint).max;

        for (uint i = 0; i < book.borrows.length; i++) {
            if (book.borrows[i].borrower == msg.sender) {
                index = i;
                break;
            }
        }

        require(index != type(uint).max, "You didn't borrow this book");

        // Remove borrower
        book.borrows[index] = book.borrows[book.borrows.length - 1];
        book.borrows.pop();

        if (book.borrows.length == 0) {
            book.status = BookStatus.Available;
        }

        emit BookReturned(_id, book.title, msg.sender);
    }
}