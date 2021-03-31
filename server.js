const express = require('express')
const path = require('path')
const http = require('http')
const socketIO = require('socket.io')
const formatMessages = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRooms } = require('./utils/users')

const botName = 'ChatCord Bot'

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {
       const user = userJoin(socket.id, username, room)

        socket.join(user.room)

        socket.emit('message', formatMessages(botName, 'Welcome to ChatCord'))

        socket.broadcast
            .to(user.room)
            .emit('message', formatMessages(botName, `${user.username} has joined the chat`))  
    
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRooms(user.room)
        })
    })

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id)

        io.to(user.room).emit('message', formatMessages(`${user.username}`, msg))
    })

    socket.on('disconnect', () => {
        const user = userLeave(socket.id)

        if(user) {
            io.to(user.room).emit('message', formatMessages(botName, `${user.username} has left the chat`))
        }
    })
}) 

app.use(express.static(path.join(__dirname, 'public')))

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server running on ${PORT}`))