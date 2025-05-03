console.log(op)
const socket = io('');
    const main__chat__window = document.getElementById("main__chat_window");
    const videoGrids = document.getElementById("video-grids");
    const videoPin = document.getElementById("pinned");

    const myVideo = document.createElement("video");
    const chat = document.getElementById("chat");
    OtherUsername = "";
    chat.hidden = true;
    myVideo.muted = false;
    console.log(myVideo, myVideo.muted)
    window.onload = () => {
        $(document).ready(function () {
            $("#getCodeModal").modal("show");
        });
    };
    function toggleControls(op) {
        const micButton = document.getElementById('mic');
        const videoButton = document.getElementById('video');
        if (!op) {
            micButton.style.display = 'none'; // Сховати мікрофон
            videoButton.style.display = 'none'; // Сховати відео
        }
    }
    toggleControls(op=="true");
    console.log(op=="true")
    var peer = new Peer(undefined, {
        host: window.location.hostname,
        port: 80,
        path: '/peerjs',
        secure: window.location.protocol === 'https:',
        debug: 3
    });
    let myVideoStream;
    const peers = {};
    var getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;
        sendmessage = (text) => {
            if (event.key === "Enter" && text.value != "") {
                // Only send message if not from screen share connection
                    socket.emit("messagesend", myname + ":" + text.value);
                    text.value = "";
                    main__chat_window.scrollTop = main__chat_window.scrollHeight;

            }
        };
        let localStream = null;

        navigator.mediaDevices
    .getUserMedia({
        video: op === "true",
        audio: true  // Always request audio, but we can mute it if op is false
    })
    .then((stream) => {
        localStream = stream;

        // If op is false, mute the audio track
        if (op !== "true") {
            stream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
        }

        if (op === "true") {
            myVideoStream = stream;
            addVideoStream(myVideo, stream, myname);
        }

                socket.on("user-connected", (id, username) => {
                    connectToNewUser(id, localStream, username);
                    socket.emit("tellName", myname);
                });

                socket.on("user-disconnected", (id, username) => {
                    console.log("User disconnected:", id);
                    if (peers[id]) {
                        peers[id].close();
                        delete peers[id];
                    }

                    // Remove the video grid for disconnected user
                    removeUserVideo(username);
                    updateVideoLayout();
                });
            })
            .catch((err) => {
                console.error("Failed to get local stream", err);
                // If media access fails, create a fallback stream with no audio/video
                localStream = new MediaStream();

                socket.on("user-connected", (id, username) => {
                    connectToNewUser(id, localStream, username);
                    socket.emit("tellName", myname);
                });

                socket.on("user-disconnected", (id, username) => {
                    console.log("User disconnected:", id);
                    if (peers[id]) {
                        peers[id].close();
                        delete peers[id];
                    }

                    // Remove the video grid for disconnected user
                    removeUserVideo(username);
                    updateVideoLayout();
                });
            });

        peer.on("call", (call) => {
            call.answer(localStream);

            const video = document.createElement("video");
            call.on("stream", (remoteStream) => {
                addVideoStream(video, remoteStream, OtherUsername);
            });
        });


    peer.on("open", (id) => {
        socket.emit("join-room", roomId, id, myname);
    });


    socket.on("createMessage", (message) => {
        var ul = document.getElementById("messageadd");
        var li1 = document.createElement("li");
        li1.className = "name-chat";
        li1.appendChild(document.createTextNode(message.split(":")[0]));
        ul.appendChild(li1);
        var li = document.createElement("li");
        li.className = "message";
        li.appendChild(document.createTextNode(message.split(":")[1]));
        ul.appendChild(li);
    });

    socket.on("AddName", (username) => {
        OtherUsername = username;
    });

    const RemoveUnusedDivs = () => {
        //
        alldivs = videoGrids.getElementsByTagName("div");
        for (var i = 0; i < alldivs.length; i++) {
            e = alldivs[i].getElementsByTagName("video").length;
            if (e == 0) {
                alldivs[i].remove();
            }
        }
        alldivs = videoPin.getElementsByTagName("div");
        for (var i = 0; i < alldivs.length; i++) {
            e = alldivs[i].getElementsByTagName("video").length;
            if (e == 0) {
                alldivs[i].remove();
            }
        }
    if(!alldivs.length){
        videoPin.style.display = "none";
    }
    };
    const removeUserVideo = (username) => {
        const videoGrids = document.querySelectorAll('.video-grid');
        videoGrids.forEach(grid => {
            if (grid.getAttribute('data-user-id') === username) {
                // Stop all tracks before removing
                const video = grid.querySelector('video');
                if (video && video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                }
                grid.remove();
            }
        });
        RemoveUnusedDivs();
    };
    const connectToNewUser = (userId, streams, username) => {
        const call = peer.call(userId, streams);
        const video = document.createElement("video");

        call.on("stream", (userVideoStream) => {
            if(username.includes("(Screen)")){
                addScreenStream(video, userVideoStream, username);
            }else{
                addVideoStream(video, userVideoStream, username);
            }
        });

        call.on("close", () => {
            video.remove();
            RemoveUnusedDivs();
        });

        peers[userId] = call;

        // Share screen with new user if we're currently sharing
        if (isScreenSharing && screenStream && screenSharePeer) {
            try {
                const screenCall = screenSharePeer.call(userId, screenStream);
            } catch (err) {
                console.error('Failed to share screen with new user:', err);
            }
        }
    };



    const muteUnmute = () => {
        const enabled = myVideoStream.getAudioTracks()[0].enabled;
        if (enabled) {
            myVideoStream.getAudioTracks()[0].enabled = false;
            document.getElementById("mic").style.background = "url('https://artemissssss.github.io/-------------------/img/no-recording.png')";
        } else {
            myVideoStream.getAudioTracks()[0].enabled = true;
            document.getElementById("mic").style.background = "url('https://artemissssss.github.io/-------------------/img/microphone-black-shape%20(1).png')";
        }
    };

    const VideomuteUnmute = () => {
        const enabled = myVideoStream.getVideoTracks()[0].enabled;
        if (enabled) {
            myVideoStream.getVideoTracks()[0].enabled = false;
            console.log(myVideoStream.getVideoTracks()[0], peers)
            console.log(myVideo, myVideo.src, myVideoStream.src)
            document.getElementById("video").style.background = "url('https://artemissssss.github.io/-------------------/img/no-video.png')"
        } else {
            document.getElementById("video").style.background = "url('https://artemissssss.github.io/-------------------/img/video-camera%20(1).png')"
            myVideoStream.getVideoTracks()[0].enabled = true;
            console.log(myVideoStream.getVideoTracks()[0])
        }
    };
    chat.hidden = true;
    const showchat = () => {
        if (chat.hidden == false) {
            chat.hidden = true;
            if (window.innerWidth > 1199) {
                document.getElementById("about-prog").style.width = "1230px"
                document.getElementById("need-2").style.width = "1230px"
                document.getElementById("mainclone").style.width = "1230px"
            }
            document.getElementById("chat-1").style.background = "url('https://artemissssss.github.io/-------------------/img/chat%20(1).png')"
        } else {
            if (window.innerWidth > 1199) {
                document.getElementById("about-prog").style.width = "958.55px"
                document.getElementById("need-2").style.width = "958.55px"
                document.getElementById("mainclone").style.width = "958.55px"
            }
            document.getElementById("chat-1").style.background = "url('https://artemissssss.github.io/-------------------/img/chat.png')"
            chat.hidden = false;
        }
    };
    const EmotesChanger = () => {
        if (document.getElementById("emotes-list").style.display == "none") {
            document.getElementById("emotes-list").style.display = "flex"
        } else {
            document.getElementById("emotes-list").style.display = "none"
        }
    }
    const Recorder = () => {
        if (document.getElementById("recorder-list").style.display == "none") {
            document.getElementById("recorder-list").style.display = "inline-block"
        } else {
            document.getElementById("recorder-list").style.display = "none"
        }
    }

    let screenSharePeer = null;
    let screenStream = null;
    let isScreenSharing = false;
    let screenVideoElement = null;

    // Updated toggle screen share function with better visibility and cleanup
    async function toggleScreenShare() {
        if (!isScreenSharing) {
            try {
                // Get screen stream
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });

                // Create screen video element
                screenVideoElement = document.createElement('video');
                screenVideoElement.classList.add('screenShare');
                screenVideoElement.setAttribute('autoplay', true);
                screenVideoElement.setAttribute('playsinline', true);

                // Create new peer for screen sharing
                screenSharePeer = new Peer(undefined, {
                    host: window.location.hostname,
                    port: 80,
                    path: '/peerjs',
                    secure: window.location.protocol === 'https:',
                    debug: 3
                });

                // Handle peer open event
                screenSharePeer.on('open', (screenId) => {
                    socket.emit('join-room', roomId, screenId, `${myname} (Screen)`);

                    // Add local screen preview
                    addScreenStream(screenVideoElement, screenStream, `${myname} (Screen)`);
                });

                // Handle incoming calls for screen share
                screenSharePeer.on('call', (call) => {
                    call.answer(screenStream);

                    call.on('stream', (remoteStream) => {
                        // Handle remote stream if needed
                    });
                });

                // Handle screen share stop from browser
                screenStream.getVideoTracks()[0].onended = () => {
                    cleanupScreenShare();
                };

                // Update state
                isScreenSharing = true;
                document.getElementById('screen-share-btn').style.background = "url('https://artemissssss.github.io/-------------------/img/share.png')";

                // Connect to existing peers
                Object.keys(peers).forEach((userId) => {
                    const call = screenSharePeer.call(userId, screenStream);
                });

            } catch (err) {
                console.error('Failed to share screen:', err);
                cleanupScreenShare();
            }
        } else {
            cleanupScreenShare();
        }
    }

    // Improved cleanup function
    function cleanupScreenShare() {
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
            });
        }

        if (screenSharePeer) {
            screenSharePeer.disconnect();
            screenSharePeer.destroy();
        }

        // Remove screen video element if it exists
        if (screenVideoElement && screenVideoElement.parentElement) {
            screenVideoElement.parentElement.remove();
        }

        // Reset all variables
        screenStream = null;
        screenSharePeer = null;
        screenVideoElement = null;
        isScreenSharing = false;

        // Update button style
        document.getElementById('screen-share-btn').style.background = "url('https://artemissssss.github.io/-------------------/img/sharewhite.png')";

        // Cleanup video grid
        RemoveUnusedDivs();
    }
    //=====================================================================
    let shouldStop = false;
    let stopped = false;
    const videoElement = document.getElementsByTagName("video")[0];
    const downloadLink = document.getElementById('download');
    const audioRecordConstraints = {
        echoCancellation: true
    }

    const handleRecord = function ({
        stream,
        mimeType
    }) {
        let recordedChunks = [];
        stopped = false;
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = function (e) {
            if (e.data.size > 0) {
                recordedChunks.push(e.data);
            }

            if (shouldStop === true && stopped === false) {
                mediaRecorder.stop();
                stopped = true;
            }
        };

        mediaRecorder.onstop = function () {
            const blob = new Blob(recordedChunks, {
                type: mimeType
            });
            recordedChunks = []
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `ЗаписЗустрічі.webm`;
            videoElement.srcObject = null;
            downloadLink.click()
        };

        mediaRecorder.start(200);
    };
    let m = 0;
    async function recordAudio() {
        if (m == 0) {
            const mimeType = 'audio/webm';
            shouldStop = false;
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioRecordConstraints
            });
            handleRecord({
                stream,
                mimeType
            })
            m = 1;
        } else {
            shouldStop = true;
            m = 1;
        }
    }
    let o = 1;
    async function recordScreen() {
        if (o == 1) {
            const mimeType = 'video/webm';
            shouldStop = false;
            const constraints = {
                video: {
                    cursor: 'motion'
                }
            };
            if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
                return window.alert('Screen Record not supported!')
            }
            let stream = null;
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "motion"
                },
                audio: {
                    'echoCancellation': true
                }
            });
            const audioContext = new AudioContext();

            const voiceStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    'echoCancellation': true
                },
                video: false
            });
            const userAudio = audioContext.createMediaStreamSource(voiceStream);

            const audioDestination = audioContext.createMediaStreamDestination();
            userAudio.connect(audioDestination);

            if (displayStream.getAudioTracks().length > 0) {
                const displayAudio = audioContext.createMediaStreamSource(displayStream);
                displayAudio.connect(audioDestination);
            }

            const tracks = [...displayStream.getVideoTracks(), ...audioDestination.stream.getTracks()]
            stream = new MediaStream(tracks);
            handleRecord({
                stream,
                mimeType
            })
            videoElement.srcObject = stream;
            o = 0;
        } else {
            shouldStop = true;
            o = 1;
        }
    }
    //====================================================================
    const addVideoStream = (videoEl, stream, name) => {
        // Don't add video stream if op is false and it's not our own video
        if (op !== "true" && name !== myname) {
            return;
        }

        videoEl.srcObject = stream;
        videoEl.setAttribute('playsinline', '');
        videoEl.setAttribute('autoplay', '');

        videoEl.addEventListener("loadedmetadata", () => {
            videoEl.play().catch(err => {
                console.warn("Playback failed:", err);
            });
        });

        const h1 = document.createElement("h2");
        const h1name = document.createTextNode(name);
        h1.className = "name-of-user"
        h1.appendChild(h1name);
        const videoGrid = document.createElement("div");
        videoGrid.classList.add("video-grid");
        videoGrid.setAttribute('data-user-id', name); // Add identifier for removal
        videoGrid.appendChild(h1);
        videoGrids.appendChild(videoGrid);
        videoGrid.append(videoEl);
        RemoveUnusedDivs();

        updateVideoLayout();
    };
    const updateVideoLayout = () => {
        let totalUsers = document.getElementsByTagName("video").length;
        if (totalUsers > 1) {
            for (let index = 0; index < totalUsers; index++) {
                document.getElementsByTagName("video")[index].style.width =
                    100 / totalUsers + "%";
            }
        }
    }
    const addScreenStream = (videoEl, stream, name) => {
        videoEl.srcObject = stream;
        videoEl.addEventListener("loadedmetadata", () => {
            videoEl.play();
        });
        const h1 = document.createElement("h2");
        const h1name = document.createTextNode(name);
        h1.className = "name-of-user"
        h1.appendChild(h1name);
        const videoGrid = document.createElement("div");
        videoGrid.classList.add("stream");
        videoGrid.appendChild(h1);
        videoPin.style.display = "flex"
        videoPin.appendChild(videoGrid);
        videoGrid.append(videoEl);
        RemoveUnusedDivs();
        let totalUsers = document.getElementsByTagName("video").length;
        if (totalUsers > 1) {
            for (let index = 0; index < totalUsers; index++) {
                document.getElementsByTagName("video")[index].style.width =
                    100 / totalUsers + "%";
            }
        }
    };
    let yx = 0;
    document.getElementById("main_videos").addEventListener("dblclick", (e) => {
        if (yx == 0) {
            $(e.path[1]).appendTo("#pinned")
            e.path[1].style.transform = "scale(2.2)"
            document.getElementById("pinned").style.display = "flex"
            yx = 1;
        } else {
            $(e.path[1]).appendTo("#main_videos")
            e.path[1].style.transform = "scale(-2.2)"
            document.getElementById("pinned").style.display = "none"
            yx = 0;
        }
    })

    function copyToClipboard(str) {
        var area = document.createElement('textarea');

        document.body.appendChild(area);
        area.value = str;
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
    }
    document.getElementById("id-conference").innerHTML = "/join/" + roomId;
    document.getElementById("id-conference").addEventListener("click", () => {
        copyToClipboard("/join/" + roomId)
    })
    document.getElementById("id-conference").addEventListener("dblclick", () => {
    })

    // Отримуємо посилання на відеоелемент демонстрації екрана кімнати
    let roomVideoElement = null;
    let roomVideoContainer = null;

    // Слухач для отримання початкового стану відео кімнати від сервера
    socket.on("room-video-state", (videoState) => {
        console.log("Received initial room video state from server:", videoState);

        if (videoState && videoState.videoUrl) {
            // Перевіряємо, чи існує контейнер для відео демонстрації екрана
            roomVideoContainer = document.getElementById("room-video-container");

            if (!roomVideoContainer) {
                // Якщо контейнера ще немає, створюємо його
                roomVideoContainer = document.createElement("div");
                roomVideoContainer.id = "room-video-container";
                roomVideoContainer.classList.add("stream"); // Використовуємо клас "stream" для стилізації як демонстрації екрана

                // Створюємо мітку для відео
                const label = document.createElement("h2");
                label.className = "name-of-user"; // Використовуємо існуючий клас або створюємо новий
                label.textContent = "ЗАПИСАНЕ ВІДЕО"; // Встановлюємо потрібну мітку

                // Створюємо відеоелемент, якщо він ще не створений
                roomVideoElement = document.createElement("video");
                roomVideoElement.id = "room-screen-demo"; // Унікальний ID
                roomVideoElement.setAttribute('playsinline', '');
                roomVideoElement.setAttribute('autoplay', ''); // Дозволяємо автовідтворення
                roomVideoElement.muted = false; // Переконаємося, що не заглушено за замовчуванням
                // roomVideoElement.setAttribute('controls', ''); // Елементи керування видалено

                // Встановлюємо джерело відео
                roomVideoElement.src = videoState.videoUrl;

                // Додаємо слухач для події loadedmetadata
                roomVideoElement.addEventListener("loadedmetadata", () => {
                    console.log("Room video metadata loaded.");
                    // Встановлюємо початковий час відтворення, отриманий від сервера
                    roomVideoElement.currentTime = videoState.currentTime;

                    // Коли метадані завантажені, ми знаємо тривалість відео в браузері
                    // Надсилаємо тривалість на сервер, якщо вона ще невідома
                    if (videoState.duration === null || videoState.duration === undefined) {
                         console.log("Reporting video duration to server:", roomVideoElement.duration);
                         socket.emit("report-video-duration", roomId, roomVideoElement.duration);
                    }

                    // Намагаємося відтворити, якщо сервер вказує на це
                    // Перенесено логіку play() сюди, щоб гарантувати, що метадані завантажені
                    if (videoState.isPlaying) {
                         roomVideoElement.play().catch(err => {
                            console.warn("Room video autoplay failed on loadedmetadata:", err);
                            // Можливо, потрібна взаємодія з користувачем для початку відтворення через обмеження браузера
                             alert("Будь ласка, натисніть 'OK' для відтворення відео демонстрації екрана.");
                             roomVideoElement.play().catch(err => console.error("Manual playback failed:", err));
                        });
                    } else {
                         // Якщо сервер вказує на паузу, переконаємося, що відео на паузі
                         roomVideoElement.pause();
                    }
                });

                // Додаємо слухач для події 'ended', щоб видалити відео, коли воно закінчиться (якщо сервер не надішле подію раніше)
                roomVideoElement.addEventListener('ended', () => {
                    console.log("Room video ended locally.");
                     // Ми все одно чекаємо на подію 'room-video-ended' від сервера для синхронізації видалення
                });


                // Додаємо елементи до контейнера
                roomVideoContainer.appendChild(label);
                roomVideoContainer.appendChild(roomVideoElement);

                // Додаємо контейнер до області закріплених відео
                videoPin.style.display = "flex"; // Переконаємося, що контейнер відображається
                videoPin.appendChild(roomVideoContainer);

                console.log("Room video container and element created and added to videoPin.");

            } else {
                 // Якщо контейнер вже існує, отримуємо посилання на відеоелемент
                 roomVideoElement = document.getElementById("room-screen-demo");
                 if (roomVideoElement && roomVideoElement.src !== videoState.videoUrl) {
                     // Якщо URL відео змінився, оновлюємо його
                     roomVideoElement.src = videoState.videoUrl;
                     roomVideoElement.load(); // Перезавантажуємо джерело відео
                      console.log("Updated room video source to:", videoState.videoUrl);
                 }
                 // Встановлюємо поточний час на основі початкового стану
                 if (roomVideoElement) {
                     roomVideoElement.currentTime = videoState.currentTime;
                     if (videoState.isPlaying && roomVideoElement.paused) {
                         roomVideoElement.play().catch(err => console.warn("Autoplay after update failed:", err));
                     } else if (!videoState.isPlaying && !roomVideoElement.paused) {
                         roomVideoElement.pause();
                     }
                 }
            }

            // Оновлюємо макет відео після додавання/оновлення відео кімнати
            updateVideoLayout();

        } else {
            // Якщо відео не існує для кімнати або стан недійсний, видаляємо відео, якщо воно є
            if (roomVideoContainer) {
                roomVideoContainer.remove();
                roomVideoElement = null; // Очищаємо посилання
                roomVideoContainer = null;
                 console.log("Room video removed as no video state received or state is invalid.");
                updateVideoLayout(); // Оновлюємо макет після видалення
            }
        }
    });

    // Слухач для отримання оновлень часу відтворення від сервера
    socket.on("room-video-time-update", (currentTime) => {
        // console.log("Received video time update:", currentTime);
        if (roomVideoElement) {
            // Встановлюємо поточний час відео на основі оновлення від сервера
            // Додаємо невеликий поріг, щоб уникнути надмірних перемотувань через невеликі розбіжності
            const timeDifference = Math.abs(roomVideoElement.currentTime - currentTime);
             if (timeDifference > 0.3) { // Поріг 300 мс
                roomVideoElement.currentTime = currentTime;
                 // console.log(`Adjusted video time to ${currentTime}`);
             }
             // Переконаємося, що відео відтворюється, якщо сервер вказує на це (хоча сервер тепер завжди "відтворює")
             // Додано перевірку на paused, щоб уникнути помилок або зайвих викликів play()
             if (roomVideoElement.paused) {
                 roomVideoElement.play().catch(err => console.warn("Autoplay on time update failed:", err));
             }
        }
    });

     // Слухач для події завершення відео від сервера
     socket.on("room-video-ended", () => {
         console.log("Received video ended event from server.");
         if (roomVideoContainer) {
             roomVideoContainer.remove();
             roomVideoElement = null;
             roomVideoContainer = null;
             updateVideoLayout(); // Оновлюємо макет після видалення
         }
     });

    // Видаляємо слухачів подій керування відео, оскільки керування йде від сервера
    // if (roomVideoElement) {
    //     roomVideoElement.removeEventListener('play', ...);
    //     roomVideoElement.removeEventListener('pause', ...);
    //     roomVideoElement.removeEventListener('seeked', ...);
    // }

