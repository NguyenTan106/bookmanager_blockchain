// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract BookManager is AccessControlEnumerable  {
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
        string ipfsHash;
        string coverImageHash;
        BookStatus status;
        BorrowInfo[] borrows;
        bool isDeleted;
        address performedBy;
    }

    uint public nextId;
    mapping(uint => Book) public books;
    mapping(string => bool) private usedTitles;
    mapping(address => string) public usernames;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not admin");
        _;
    }

    // -------- Events --------
    event BookAdded(uint id, string title, string ipfsHash, uint price, address owner);
    event BookDeleted(uint indexed id, address performedBy);
    event BookEdited(uint indexed id, string title, uint price, address performedBy);
    event BookBorrowed(uint indexed id, address indexed borrower, uint returnDate);
    event BookReturned(uint id, string title, address performedBy);
    event AdminGranted(address indexed account, address performedBy);
    event AdminRevoked(address indexed account, address performedBy);
    event BookPurchased(uint indexed id, address indexed buyer, uint price);

    // -------- Admin Management --------
    function grantAdmin(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
        emit AdminGranted(account, msg.sender);
    }

    function revokeAdmin(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, account);
        emit AdminRevoked(account, msg.sender);
    }

    // -------- Book Management --------
    function addBook(string memory _title, string memory _ipfsHash, string memory _coverImageHash, uint _price) public onlyAdmin {
        require(!usedTitles[_title], "Book title already exists");
        require(bytes(usernames[msg.sender]).length > 0, "You must set your username first");

        Book storage newBook = books[nextId];
        newBook.id = nextId;
        newBook.title = _title;
        newBook.ipfsHash = _ipfsHash;
        newBook.coverImageHash = _coverImageHash;
        newBook.price = _price;
        newBook.owner = msg.sender; // chỉ lưu địa chỉ, không lưu tên
        newBook.status = BookStatus.Available;
        newBook.isDeleted = false;
        newBook.performedBy = msg.sender;
        usedTitles[_title] = true;

        emit BookAdded(nextId, _title, _ipfsHash, _price, msg.sender); // bỏ author string
        nextId++;
    }

    function editBook(uint _id, string memory _title, string memory _ipfsHash, string memory _coverImageHash, uint _price) public onlyAdmin {
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

            emit BookEdited(_id, book.title, book.price, msg.sender);
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

    // -------- Payment --------
    // Ai đã mua cuốn sách nào
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


    // -------- Borrowing --------
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



    // function revokeUserFromBook(uint bookId, address user) public onlyAdmin {
    //     require(bookId < nextId, "Book does not exist");
    //     Book storage book = books[bookId];
    //     uint index = type(uint).max;

    //     for (uint i = 0; i < book.borrows.length; i++) {
    //         if (book.borrows[i].borrower == user) {
    //             index = i;
    //             break;
    //         }
    //     }

    //     require(index != type(uint).max, "User did not borrow this book");

    //     book.borrows[index] = book.borrows[book.borrows.length - 1];
    //     book.borrows.pop();

    //     if (book.borrows.length == 0) {
    //         book.status = BookStatus.Available;
    //     }

    //     emit BookReturned(bookId, book.title, msg.sender);
    // }

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

    // -------- Getters --------
    function getBook(uint _id) public view returns (Book memory) {
        return books[_id];
    }

    function getBorrowers(uint _id) public view returns (BorrowInfo[] memory) {
        return books[_id].borrows;
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
