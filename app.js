const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

let db = null
const dbPath = path.join(__dirname, 'userData.db')

const connection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3003, () => {
      console.log('server Running.....')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
const validPassword = password => {
  return password.length > 4
}

connection()

// API : 1 Registration

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * 
    FROM user 
    WHERE username = "${username}";`
  const isUserThare = await db.get(selectUserQuery)

  if (isUserThare === undefined) {
    const addingUserQuery = `
            INSERT INTO user(username,name,password,gender,location)
            VALUES(
                "${username}",
                "${name}", 
                "${hashedPassword}",
                "${gender}",
                "${location}");`

    if (validPassword(password)) {
      await db.run(addingUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// API : 2 Login User

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
    SELECT * 
    FROM user 
    WHERE username = "${username}";`
  const isUserExists = await db.get(selectUserQuery)

  if (isUserExists === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      isUserExists.password,
    )

    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// API : 3 Change Passowrd

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const selectUserQuery = `
    SELECT * 
    FROM user
     WHERE username = "${username}";`
  const userData = await db.get(selectUserQuery)

  if (userData === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isCorrectPass = await bcrypt.compare(oldPassword, userData.password)

    if (isCorrectPass === true) {
      if (validPassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updateQuery = `
                UPDATE user 
                SET password = "${hashedPassword}"
                WHERE username = "${username}";`
        await db.run(updateQuery)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
