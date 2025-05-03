const express = require("express");
const app = express();
const url = require("url");
const path = require("path");
const server = require('http').createServer(app);
const { ExpressPeerServer } = require("peer");
const { v4: uuidv4 } = require("uuid");
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
});
const fs = require('fs');
const multer = require('multer');
// Видалено залежність від ffprobe


// Створення директорії для зберігання відео, якщо вона не існує
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Налаштування multer для завантаження файлів
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Генеруємо унікальне ім'я для файлу
        const videoId = uuidv4();
        const fileExt = path.extname(file.originalname);
        cb(null, `${videoId}${fileExt}`);
    }
});

// Фільтр для перевірки типу файлу (тільки відео)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Можна завантажувати тільки відео файли!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024 * 1024 // обмеження розміру файлу (500МБ)
    }
});

const peerServer = ExpressPeerServer(server, {
    path: '/peerjs', // This should match the client side path
    debug: true,
    path: '/',
    allow_discovery: true,
    cors: {
        origin: '*'
    }
});

const { config } = require("process");
const PORT = 80;
//|| config.get('serverPort');
app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "static")));
app.use("/peerjs", peerServer);
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Доступ до папки з відео

// Об'єкт для зберігання інформації про відео та стан відтворення для кожної кімнати
const roomVideoStates = {};
const playbackIntervals = {}; // Для зберігання інтервалів оновлення часу відтворення

// Функція для отримання тривалості відео за допомогою ffprobe - ВИДАЛЕНО


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "static", "index.html"));
});

// Обробка POST запиту для завантаження відео і створення кімнати
app.post("/join", upload.single('videoFile'), async (req, res) => {
    try {
        const roomId = uuidv4();
        const name = req.body.name || '';
        const surname = req.body.surname || '';
        let videoUrl = null;
        // videoDuration більше не отримується тут

        // Якщо відео було завантажено
        if (req.file) {
            // Створюємо посилання на відео
            videoUrl = `/video/${req.file.filename}`;

            // Ініціалізуємо стан відео для цієї кімнати
            roomVideoStates[roomId] = {
                videoUrl: videoUrl,
                isPlaying: true, // Відео починає відтворюватися автоматично
                currentTime: 0,
                duration: null, // Тривалість спочатку невідома
                startTime: Date.now() // Час початку відтворення на сервері
            };
            console.log(`Video ${videoUrl} uploaded and state initialized for room ${roomId}. Duration will be reported by client.`);

            // Запускаємо інтервал для оновлення часу відтворення
            // Інтервал буде зупинено, коли отримаємо тривалість і досягнемо кінця
            playbackIntervals[roomId] = setInterval(() => {
                if (roomVideoStates[roomId] && roomVideoStates[roomId].isPlaying) {
                    const elapsed = (Date.now() - roomVideoStates[roomId].startTime) / 1000;
                    const newTime = roomVideoStates[roomId].duration !== null ? Math.min(elapsed, roomVideoStates[roomId].duration) : elapsed; // Використовуємо тривалість, якщо відома
                    roomVideoStates[roomId].currentTime = newTime;

                    // Надсилаємо оновлення часу всім у кімнаті
                    io.to(roomId).emit("room-video-time-update", roomVideoStates[roomId].currentTime);

                    // Якщо тривалість відома і відео закінчилося, зупиняємо відтворення на сервері
                    if (roomVideoStates[roomId].duration !== null && newTime >= roomVideoStates[roomId].duration) {
                        roomVideoStates[roomId].isPlaying = false;
                        roomVideoStates[roomId].currentTime = roomVideoStates[roomId].duration; // Встановлюємо на кінець
                        clearInterval(playbackIntervals[roomId]); // Зупиняємо інтервал
                        delete playbackIntervals[roomId];
                         console.log(`Video playback finished for room ${roomId}`);
                         // Надсилаємо подію клієнтам, що відео закінчилося
                         io.to(roomId).emit("room-video-ended");
                    }
                }
            }, 200); // Оновлюємо час кожні 200 мс


        }

        // Перенаправляємо користувача до кімнати
        res.redirect(
            url.format({
                pathname: `/join/${roomId}`,
                query: {
                    name: `${name} ${surname}`,
                    op: true,
                },
            })
        );
    } catch (error) {
        console.error("Помилка при завантаженні відео:", error);
        res.status(500).send("Помилка при завантаженні відео");
    }
});

app.get("/join", (req, res) => {
    // Цей маршрут для приєднання без завантаження відео
    res.redirect(
        url.format({
            pathname: `/join/${uuidv4()}`,
            query: {...req.query, op: true},
        })
    );
});

app.get("/joinold", (req, res) => {
    res.redirect(
        url.format({
            pathname: req.query.meeting_id,
            query: {...req.query, op: false},
        })
    );
});

app.get("/api/sleep", (req, res) => {
    res.status(200).json({ok: true});
});

// Функція для визначення MIME-типу відео за розширенням
function getVideoMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.wmv': 'video/x-ms-wmv',
        '.flv': 'video/x-flv',
        '.mkv': 'video/x-matroska'
    };

    return mimeTypes[ext] || 'video/mp4'; // За замовчуванням mp4
}

// Пряме посилання для перегляду відео
app.get("/video/:videoId", (req, res) => {
    const videoFilename = req.params.videoId;
    const filePath = path.join(uploadDir, videoFilename);

    // Перевіряємо, чи існує файл
    if (!fs.existsSync(filePath)) {
        return res.status(404).send("Відео не знайдено");
    }

    // Отримуємо розмір файлу
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const mimeType = getVideoMimeType(videoFilename);

    // Підтримка часткового завантаження (для стрімінгу)
    const range = req.headers.range;

    if (range) {
        // Розбір запиту на діапазон байтів
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, {start, end});

        // Відправка відповіді з частковим контентом
        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": mimeType
        });
        file.pipe(res);
    } else {
        // Відправка всього файлу
        res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": mimeType
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

app.get("/join/:rooms", (req, res) => {
    // Add null checks to prevent errors with undefined values
    const roomId = req.params.rooms || '';
    const name = req.query.name || '';
    const isOp = req.query.op === 'true' || req.query.op === true;

    res.render("room", {
        roomid: roomId,
        Myname: name,
        op: isOp,
    });
});

io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    socket.on("join-room", (roomId, id, myname) => {
        if (!roomId) {
            console.error("Invalid room ID provided");
            return;
        }

        console.log(`User ${myname || 'Anonymous'} (${id}) joined room ${roomId}`);
        socket.join(roomId);

        // Якщо для цієї кімнати є відео, надіслати його URL та поточний стан новому користувачеві
        if (roomVideoStates[roomId]) {
            console.log(`Emitting initial video state for room ${roomId} to user ${id}:`, roomVideoStates[roomId]);
            // Надсилаємо початковий стан відео лише новому користувачеві
            socket.emit("room-video-state", roomVideoStates[roomId]);
        }


        // Повідомляємо інших користувачів у кімнаті про нового користувача
        socket.to(roomId).emit("user-connected", id, myname);

        socket.on("messagesend", (message) => {
            try {
                console.log(`Message in room ${roomId}:`, message);
                io.to(roomId).emit("createMessage", message);
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });

        socket.on("tellName", (myname, op) => {
            try {
                console.log(`User name update: ${myname}`);
                socket.to(roomId).emit("AddName", myname);
                socket.to(roomId).emit("AddOp", op);
            } catch (error) {
                console.error("Error processing name:", error);
            }
        });

        socket.on("disconnect", () => {
            console.log(`User ${myname || 'Anonymous'} (${id}) left room ${roomId}`);
            socket.to(roomId).emit("user-disconnected", id, myname);

            // TODO: Додати логіку для зупинки інтервалу оновлення часу та видалення стану відео кімнати,
            // якщо всі користувачі вийшли. Це потребує відстеження кількості користувачів у кожній кімнаті.
        });

        socket.on("userInfo", (myname, op) => {
            socket.broadcast.to(roomId).emit("userInfo", myname, op);
        });

        // Новий обробник для отримання тривалості відео від клієнта
        socket.on("report-video-duration", (roomId, duration) => {
            console.log(`Received video duration for room ${roomId}: ${duration}s`);
            if (roomVideoStates[roomId] && roomVideoStates[roomId].duration === null) {
                roomVideoStates[roomId].duration = duration;
                console.log(`Updated duration for room ${roomId} to ${duration}s`);
                // Можна також розіслати оновлений стан всім клієнтам, якщо потрібно
                // io.to(roomId).emit("room-video-state", roomVideoStates[roomId]);
            }
        });

    });

    socket.on("error", (error) => {
        console.error("Socket error:", error);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

peerServer.on('connection', (client) => {
    console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
    console.log('Client disconnected:', client.getId());
});

peerServer.on('error', (error) => {
    console.error('PeerServer error:', error);
});

// Add server error handlers
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Add process error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
        process.exit(1);
    }
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
