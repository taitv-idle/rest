let io;

module.exports = {
    init: (httpServer, options = {}) => {
        io = require('socket.io')(httpServer, options); // Nhận các cấu hình từ tham số
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Not connected to socket.io');
        }
        return io;
    }
};
