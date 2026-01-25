# Game Project API DocumentationGame Project API Documentation

This document outlines the available endpoints for user authentication and email services within the Game Project application.

## Base URL

 ```js
https://dice-627497957398.europe-west1.run.app
```

## 1. User Authentication

## 1.1. User Signup

POST Endpoint

/api/auth/signup <br>

Registers a new user in the system.

### Request Body (JSON)

```js
{
    "email": "abc12@gmail.com",
    "password": "Abcd@123",
    "firstName": "Hamza",
    "lastName": "Mehmet",
    "phoneNumber": 923405588493,
    "role": "user"
}
 ```

### Response (JSON)
 ```js
{
 "uid": "693aa3e7c32c523112c2667b",
 "email": "abc12@gmail.com",
 "firstName": "Hamza",
 "lastName": "Mehmet",
 "phoneNumber": "923405588493",
 "role": "user"

}
```


## 1.2. User Login

GET Endpoint
/api/auth/login?phoneNumber=923405588493&password=Abcd@123 <br>
Logs in a new user in the system. requires a proper formatted email and a strong password.

### Response (JSON)



```js
{

    "uid": "693aa3e7c32c523112c2667b",
    "email": "abc12@gmail.com",
    "firstName": "Hamza",
    "lastName": "Mehmet",
    "phoneNumber": "923405588493",
    "role": "user"

}
```
## 1.3. Forgot Password

POST Endpoint

/api/mailsender/forgotPassword <br>

Sends an email to specified email address with a verification code if passwords are matching.


### Request Body (JSON)

```js
{
"email": "princehamzi.mine@gmail.com",
"newPassword": "user@456",
"confirmPassword": "user@456"
}
 ```

### Response (JSON)
 ```js
{
"status": "200",
"message": "Verification code sent to email",
"verificationCode": 339428
}
 ```


## 1.4. Reset Password

POST Endpoint

api/mailsender/resetPassword

Sets new password if email exist

### Request Body (JSON)
```js
"email": "princehamzi.mine@gmail.com",
"password": "Hamza@786"
}
```


### Response (JSON)
```js
{
"status": "200",
"message": "Password reset successfully"
}
```

## 2. Live users & gameplay
## 2.1. Live users
GET Endpoint
/api/game/searchPlayers <br>
### Response (JSON)


 ```js
{
    "onlineUsers": 
    [
     {
        "uid":"abc345asf753bgh346wsdw3",
        "displayName":"Hamza"
     }
   ]
}
```

## 2.2. Roll Dice

POST Endpoint  /api/game/rollDice <br>

### Request Body (JSON)


```js

[
    {
        "uid": "user_001",
        "displayName": "Alice"
    },
    {
        "uid": "user_002",
        "displayName": "Bob"
    },
    {
        "uid": "user_003",
        "displayName": "Charlie"
    },
    {
        "uid": "user_004",
        "displayName": "Diana"
    },
    {
        "uid": "user_005",
        "displayName": "Ethan"
    }
]

```


### Response (JSON)

```js
[
    {
        "uid": "user_001",
        "displayName": "Alice",
        "rollDiceResult": 5,
        "winsAgainst": []
    },
    {
        "uid": "user_002",
        "displayName": "Bob",
        "rollDiceResult": 3,
        "winner": true,
        "winsAgainst": [
            "user_001",
            "user_003"
        ]
    },
    {
        "uid": "user_003",
        "displayName": "Charlie",
        "rollDiceResult": 12,
        "winsAgainst": []
    },
    {
        "uid": "user_004",
        "displayName": "Diana",
        "rollDiceResult": 4,
        "winsAgainst": []
    },
    {
        "uid": "user_005",
        "displayName": "Ethan",
        "rollDiceResult": 11,
        "winsAgainst": []
    }
]
```

## 3. Admin Panel
## 3.1. Deposit (data)
This api handles deposits data. transactions will be programmed upon further client instructions. this api is necessary to show deposits history later

POST /api/admin/deposit <br>
Request body

```js
{
    "uid": "user_001",
    "displayName": "Alice",
    "vip": true,
    "amount": 2000
}
```

Response (JSON)
```js
{
    "status": 201,
    "message": "Deposit successful",
    "depositId": "693af12933e7e6f79cc748bc"
}
```

## 3.2. Deposit history (data)
get deposit history on admin panel

GET /api/admin/depositHistory <br>

Response (JSON)
```js
[
    {
        "_id": "693a8ae80148176240b59993",
        "uid": "user_001",
        "displayName": "Alice",
        "amount": 1000,
        "vip": false,
        "timestamp": "2025-12-11T09:12:08.133Z",
        "__v": 0
    },
    {
        "_id": "693a8d83207d79ef24f07399",
        "uid": "user_001",
        "displayName": "Alice",
        "amount": 2000,
        "vip": true,
        "timestamp": "2025-12-11T09:23:15.895Z",
        "__v": 0
    }
]
```

## 3.3. Deposit history (data)
Check profitability given commission.In following case commission is 5% deducted from the winners fund

GET /profitability?commission=5 <br>

Response (JSON)
```js
{
    "transactions": 2, // number of deposits
    "commission": 5,
    "totalProfit": 150,
    "depositHistory": [
        {
            "_id": "693a8ae80148176240b59993",
            "uid": "user_001",
            "displayName": "Alice",
            "amount": 1000,
            "vip": false,
            "timestamp": "2025-12-11T09:12:08.133Z",
            "__v": 0
        },
        {
            "_id": "693a8d83207d79ef24f07399",
            "uid": "user_001",
            "displayName": "Alice",
            "amount": 2000,
            "vip": true,
            "timestamp": "2025-12-11T09:23:15.895Z",
            "__v": 0
        }
    ]
}
```

## 4. Guess Game
## 4.1. Roll Dice After Guessing

POST /api/game/preGuess/rollDice <br>

send list of users you get from /api/game/searchPlayers
response will send result of roll dice and winners

Request body

```js
[
    {
        "uid": "user_001",
        "displayName": "Alice",
        "guess": [
            1,
            3
        ]
    },
    {
        "uid": "user_002",
        "displayName": "Ali",
        "guess": [
            4,
            5
        ]
    }
]
```


Response (JSON)
```js
[
    {
        "uid": "user_001",
        "displayName": "Alice",
        "guess": [
            1,
            3
        ],
        "winner": true,
        "rollDiceResult": 3
    },
    {
        "uid": "user_002",
        "displayName": "Alice",
        "guess": [
            3,
            6
        ],
        "winner": true,
        "rollDiceResult": 3
    }
]
```

