# UML Class Diagram

```mermaid
classDiagram
    class User {
        -id : number
        -fullName : string
        -email : string
        -role : string
        -isActive : boolean
        +id
        +fullName
        +email
        +role
        +isActive
        +toJSON() object
    }

    class Transaction {
        -id : number
        -type : string
        -amount : number
        -description : string
        -category : string
        -txDate : string
        -createdBy : number
        -createdAt : string
        +id
        +type
        +amount
        +description
        +category
        +txDate
        +createdBy
        +toJSON() object
    }

    class Attendance {
        -id : number
        -userId : number
        -workDate : string
        -checkIn : Date
        -checkOut : Date
        -notes : string
        +calculateTotalHours() number
        +toJSON() object
    }

    class AuthService {
        +login(email, password) Promise
        +getCurrentUser(userId) Promise
    }

    class TransactionService {
        +isValidDate(dateString) boolean
        +create(type, data, userId) Promise
        +getAll(filters) Promise
        +getSummary(filters) Promise
    }

    class IRepository {
        <<interface>>
        +getAll() Promise
        +getById(id) Promise
        +add(entity) Promise
        +save() Promise
    }

    class CsvTransactionRepository {
        -filePath : string
        -items : Transaction[]
        +getAll() Promise
        +getById(id) Promise
        +add(entity) Promise
        +save() Promise
    }

    AuthService ..> User
    TransactionService ..> Transaction
    CsvTransactionRepository ..|> IRepository
    User "1" --> "*" Transaction : creates
    User "1" --> "*" Attendance : has