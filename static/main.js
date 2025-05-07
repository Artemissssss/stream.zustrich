console.log(op)
const socket = io('');
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const videoPin = document.getElementById("pinned");

const myVideo = document.createElement("video");
const chat = document.getElementById("chat");
let OtherUsername = ""; // Повертаємо використання OtherUsername
chat.hidden = true;
myVideo.muted = false;
console.log(myVideo, myVideo.muted)
window.onload = () => {
    $(document).ready(function() {
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
toggleControls(op == "true");
console.log(op == "true")
var peer = new Peer(undefined, {
    host: window.location.hostname,
    // port: 80,
    path: '/peerjs',
    secure: window.location.protocol === 'https:',
    debug: 3
});
let myVideoStream;
const peers = {};
// Видалено об'єкт connectedUsers

var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
sendmessage = (text) => {
    if (event.key === "Enter" && text.value != "") {
        // Only send message if not from screen share connection
        socket.emit("messagesend", myname + ":" + text.value);
        text.value = "";
        main__chat__window.scrollTop = main__chat__window.scrollHeight;

    }
};
let localStream = null;

navigator.mediaDevices
    .getUserMedia({
        video: op === "true",
        audio: op === "true" // Always request audio, but we can mute it if op is false
    })
    .then((stream) => {
        localStream = stream;

        if (op === "true") {
            myVideoStream = stream;
            addVideoStream(myVideo, stream, myname, peer.id); // Pass own peer ID
        }

        socket.on("user-connected", (id, username) => {
            console.log(`User connected: ${username} (${id})`);
            // connectedUsers[id] = username; // Видалено збереження в connectedUsers
            connectToNewUser(id, localStream, username); // Передаємо username, як було раніше
            if (op === "true") {
                socket.emit("tellName", myname);
            } else {
                socket.emit("tellName", op);
            }
        });

        // Зберігаємо слухач відключення та логування
        socket.on("user-disconnected", (id) => { // Припускаємо, що сервер надсилає 'user-disconnected' з id
             console.log(`Socket event 'user-disconnected' received for ID: ${id}`);
             if (peers[id]) {
                console.log(`Closing peer connection for ID: ${id}`);
                peers[id].close();
                delete peers[id];
            } else {
                 console.log(`No peer connection found for ID: ${id}`);
            }

            // Викликаємо removeUserVideo з ID
            console.log(`Attempting to remove video for disconnected user ID: ${id}`);
            removeUserVideo(id); // Викликаємо removeUserVideo з ID
            // delete connectedUsers[id]; // Видалено видалення з connectedUsers

            updateVideoLayout();
        });
    })
    .catch((err) => {
        console.error("Failed to get local stream", err);
        // If media access fails, create a fallback stream with no audio/video
        localStream = new MediaStream();

        socket.on("user-connected", (id, username) => {
             console.log(`User connected: ${username} (${id})`);
            // connectedUsers[id] = username; // Видалено збереження в connectedUsers
            connectToNewUser(id, localStream, username); // Передаємо username
             if (op === "true") {
                socket.emit("tellName", myname);
            } else {
                socket.emit("tellName", op);
            }
        });

        // Зберігаємо слухач відключення та логування
        socket.on("user-disconnected", (id) => { // Припускаємо, що сервер надсилає 'user-disconnected' з id
            console.log(`Socket event 'user-disconnected' received for ID: ${id} (fallback stream scenario)`);
             if (peers[id]) {
                console.log(`Closing peer connection for ID: ${id}`);
                peers[id].close();
                delete peers[id];
            } else {
                 console.log(`No peer connection found for ID: ${id}`);
            }

            console.log(`Attempting to remove video for disconnected user ID: ${id}`);
            removeUserVideo(id); // Викликаємо removeUserVideo з ID
            // delete connectedUsers[id]; // Видалено видалення з connectedUsers

            updateVideoLayout();
        });
    });

peer.on("call", (call) => {
    call.answer(localStream);

    const video = document.createElement("video");
    call.on("stream", (remoteStream) => {
        // Повертаємо використання OtherUsername для відображення
        console.log(`Received stream from peer: ${call.peer}. Displaying as ${OtherUsername}`);
        // Ваша логіка диференціації для addVideoStream / addScreenStream
        if (typeof OtherUsername === 'string' && OtherUsername.includes("(Screen)")) {
            addScreenStream(video, remoteStream, OtherUsername, call.peer); // Передаємо OtherUsername та call.peer
        } else {
            // Потрібно обережно обробляти 'OtherUsername', якщо він може бути булевим 'false'
            let displayName = OtherUsername;
            if (typeof OtherUsername === 'boolean' && OtherUsername === false) {
                displayName = "User (No Camera/Mic)"; // Або інший плейсхолдер
            } else if (!OtherUsername) {
                 displayName = "Unknown User"; // Fallback if OtherUsername is not set
            }
            addVideoStream(video, remoteStream, displayName, call.peer); // Передаємо displayName та call.peer
        }
    });

     call.on("close", () => {
        console.log(`Call with peer ${call.peer} closed.`);
        // The actual removal will be handled by the 'user-disconnected' socket event
    });

    call.on("error", (err) => {
        console.error(`Error on call with peer ${call.peer}:`, err);
        // The actual removal will be handled by the 'user-disconnected' socket event
    });

    peers[call.peer] = call; // Store the call object by peer ID
});


peer.on("open", (id) => {
    if (op === "true") {
        socket.emit("join-room", roomId, id, myname);
    } else {
        socket.emit("join-room", roomId, id, op);
    }
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
    main__chat__window.scrollTop = main__chat__window.scrollHeight; // Ensure chat scrolls down
});

socket.on("AddName", (username) => {
    OtherUsername = username; // Повертаємо оновлення OtherUsername
     console.log(`Received AddName event, setting OtherUsername to: ${username}`);
});

const RemoveUnusedDivs = () => {
    let divsInVideoGrids = videoGrids.getElementsByTagName("div");
    for (var i = divsInVideoGrids.length - 1; i >= 0; i--) {
        let videoElementsInDiv = divsInVideoGrids[i].getElementsByTagName("video").length;
        if (videoElementsInDiv === 0) {
            divsInVideoGrids[i].remove();
        }
    }

    let divsInVideoPin = videoPin.getElementsByTagName("div");
    for (var i = divsInVideoPin.length - 1; i >= 0; i--) {
        let videoElementsInDiv = divsInVideoPin[i].getElementsByTagName("video").length;
        if (videoElementsInDiv === 0) {
            divsInVideoPin[i].remove();
        }
    }

    if (videoPin.getElementsByTagName("div").length === 0) {
        videoPin.style.display = "none";
    }
};

// Зберігаємо removeUserVideo, яка видаляє за data-user-id
const removeUserVideo = (userId) => {
     console.log(`Attempting to remove video for user ID: ${userId}`);
    const videoGrids = document.querySelectorAll('.video-grid');
    let removed = false;
    videoGrids.forEach(grid => {
        // Find the grid with the matching data-user-id (which is the peer ID)
        if (grid.getAttribute('data-user-id') === userId) {
            console.log(`Found video grid for user ID: ${userId}. Removing.`);
            // Stop all tracks before removing
            const video = grid.querySelector('video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                 console.log(`Stopped tracks for video in grid for user ID: ${userId}.`);
            } else {
                console.warn(`No video element or srcObject found in grid for user ID: ${userId}.`);
            }
            grid.remove();
            console.log(`Removed video grid for user ID: ${userId}`);
            removed = true;
        } else {
             console.log(`Grid data-user-id ${grid.getAttribute('data-user-id')} does not match target ID ${userId}.`);
        }
    });

     const screenStreams = document.querySelectorAll('.stream');
     screenStreams.forEach(streamDiv => {
        // Assuming screen share streams also have a way to identify the user by ID
        if (streamDiv.getAttribute('data-user-id') === userId) {
             console.log(`Found screen share stream for user ID: ${userId}. Removing.`);
             const video = streamDiv.querySelector('video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                 console.log(`Stopped tracks for video in screen stream for user ID: ${userId}.`);
            } else {
                 console.warn(`No video element or srcObject found in screen stream for user ID: ${userId}.`);
            }
            streamDiv.remove();
            console.log(`Removed screen share stream for user ID: ${userId}`);
            removed = true;
        } else {
             console.log(`Screen stream data-user-id ${streamDiv.getAttribute('data-user-id')} does not match target ID ${userId}.`);
        }
    });

    if (!removed) {
         console.warn(`No video or screen stream element found for user ID: ${userId} to remove.`);
    }


    RemoveUnusedDivs();
    updateVideoLayout(); // Оновлюємо макет після видалення
};

const connectToNewUser = (userId, streams, username) => {
    console.log(`Attempting to call user: ${username} (${userId})`);
    if (!peer || !streams) { // Додайте перевірку на існування peer та streams
        console.error("Cannot connect to new user: peer object or local stream is not available.");
        return;
    }
    const call = peer.call(userId, streams); // streams тут - це ваш localStream
    if (!call) { // Додайте перевірку, чи вдалося створити дзвінок
        console.error(`Failed to initiate call to user: ${username} (${userId})`);
        return;
    }
    const video = document.createElement("video");

    call.on("stream", (userVideoStream) => {
        // Використовуємо OtherUsername для відображення імені
        const remoteUserId = call.peer; // Отримуємо Peer ID віддаленого користувача
        console.log(`Received stream from peer: ${remoteUserId}. Displaying as ${OtherUsername}`);

        // Ваша логіка диференціації для addVideoStream / addScreenStream
        // Використовуємо OtherUsername для перевірки, чи це демонстрація екрана
        if (typeof OtherUsername === 'string' && OtherUsername.includes("(Screen)")) {
            addScreenStream(video, userVideoStream, OtherUsername, remoteUserId); // Передаємо OtherUsername та remoteUserId
        } else {
            // Потрібно обережно обробляти 'OtherUsername', якщо він може бути булевим 'false'
            let displayName = OtherUsername;
            if (typeof OtherUsername === 'boolean' && OtherUsername === false) {
                displayName = "User (No Camera/Mic)"; // Або інший плейсхолдер
            } else if (!OtherUsername) {
                 displayName = "Unknown User"; // Fallback if OtherUsername is not set
            }
            addVideoStream(video, userVideoStream, displayName, remoteUserId); // Передаємо displayName та remoteUserId
        }
    });

    call.on("close", () => {
        console.log(`Call with peer ${call.peer} closed.`);
        // The actual removal will be handled by the 'user-disconnected' socket event
    });

    call.on("error", (err) => {
        console.error(`Error on call with peer ${call.peer}:`, err);
        // The actual removal will be handled by the 'user-disconnected' socket event
    });

    peers[userId] = call;

    // Share screen with new user if we're currently sharing
    if (isScreenSharing && screenStream && screenSharePeer) {
        try {
            // Find the screen share peer ID for this user, if available
            // This might require a more complex mapping or server-side handling
            // For now, we'll just try to call with the main screenSharePeer
            const screenCall = screenSharePeer.call(userId, screenStream);
            if(screenCall) {
                 screenCall.on('stream', (remoteStream) => {
                     // Handle remote screen stream if needed
                 });
                 screenCall.on('close', () => {
                     console.log(`Screen share call with ${username} (${userId}) closed.`);
                 });
                 screenCall.on('error', (err) => {
                     console.error(`Error on screen share call with ${username} (${userId}):`, err);
                 });
                 // We might need to store screen share calls separately if we need to manage them individually
                 // screenSharePeers[userId] = screenCall;
            } else {
                 console.warn(`Failed to initiate screen share call to user: ${username} (${userId}`);
            }

        } catch (err) {
            console.error('Failed to share screen with new user:', err);
        }
    }
};



const muteUnmute = () => {
    // Check if myVideoStream is available
    if (!myVideoStream) {
        console.warn("myVideoStream is not available yet.");
        return;
    }
    const audioTrack = myVideoStream.getAudioTracks()[0];
    if (!audioTrack) {
        console.warn("No audio track available in myVideoStream.");
        return;
    }

    const enabled = audioTrack.enabled;
    if (enabled) {
        audioTrack.enabled = false;
        document.getElementById("mic").style.background = "url('https://artemissssss.github.io/-------------------/img/no-recording.png')";
    } else {
        audioTrack.enabled = true;
        document.getElementById("mic").style.background = "url('https://artemissssss.github.io/-------------------/img/microphone-black-shape%20(1).png')";
    }
};

const VideomuteUnmute = () => {
    // Check if myVideoStream is available
     if (!myVideoStream) {
        console.warn("myVideoStream is not available yet.");
        return;
    }
    const videoTrack = myVideoStream.getVideoTracks()[0];
     if (!videoTrack) {
        console.warn("No video track available in myVideoStream.");
        return;
    }
    const enabled = videoTrack.enabled;
    if (enabled) {
        videoTrack.enabled = false;
        console.log(myVideoStream.getVideoTracks()[0], peers)
        console.log(myVideo, myVideo.src, myVideoStream.src)
        document.getElementById("video").style.background = "url('https://artemissssss.github.io/-------------------/img/no-video.png')"
    } else {
        document.getElementById("video").style.background = "url('https://artemissssss.github.io/-------------------/img/video-camera%20(1).png')"
        videoTrack.enabled = true;
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
                // port: 80,
                path: '/peerjs',
                secure: window.location.protocol === 'https:',
                debug: 3
            });

            // Handle peer open event for screen share peer
            screenSharePeer.on('open', (screenId) => {
                console.log(`Screen share peer opened with ID: ${screenId}`);
                 // We might need to associate this screenId with the main user ID (peer.id)
                 // on the server side to know which user is sharing their screen.
                socket.emit('join-room', roomId, screenId, `${myname} (Screen)`);

                // Add local screen preview
                 // Use the screenId as the user ID for the screen stream as well
                addScreenStream(screenVideoElement, screenStream, `${myname} (Screen)`, screenId);
            });

            // Handle incoming calls for screen share
            screenSharePeer.on('call', (call) => {
                console.log(`Received screen share call from peer: ${call.peer}`);
                call.answer(screenStream); // Answer with our screen stream

                call.on('stream', (remoteStream) => {
                    // This is for receiving screen share from others, which is handled by the main peer 'call' event
                    // unless you want to handle screen share streams separately in the UI.
                });

                 call.on('close', () => {
                     console.log(`Screen share call with peer ${call.peer} closed.`);
                 });

                 call.on('error', (err) => {
                    console.error(`Error on incoming screen share call from peer ${call.peer}:`, err);
                 });
            });

            // Handle screen share stop from browser
            screenStream.getVideoTracks()[0].onended = () => {
                console.log("Screen share stopped by browser.");
                cleanupScreenShare();
            };

            // Update state
            isScreenSharing = true;
            document.getElementById('screen-share-btn').style.background = "url('https://artemissssss.github.io/-------------------/img/share.png')";

            // Connect to existing peers with the screen stream
             Object.keys(peers).forEach((userId) => {
                // Only call peers with the screen share stream if screenSharePeer is open
                if (screenSharePeer && screenSharePeer.open) {
                    const screenCall = screenSharePeer.call(userId, screenStream);
                     if(screenCall) {
                         screenCall.on('stream', (remoteStream) => {
                             // Handle remote screen stream
                         });
                         screenCall.on('close', () => {
                             console.log(`Screen share call to ${userId} closed.`);
                         });
                         screenCall.on('error', (err) => {
                            console.error(`Error on screen share call to ${userId}:`, err);
                         });
                         // We might need to store screen share calls separately if we need to manage them individually
                         // screenSharePeers[userId] = screenCall;
                    } else {
                         console.warn(`Failed to initiate screen share call to user: ${username} (${userId}`);
                    }
                } else {
                    console.warn("screenSharePeer is not open, cannot initiate screen share calls.");
                }
             });

        } catch (err) {
            console.error('Failed to share screen:', err);
            cleanupScreenShare();
        }
    } else {
        console.log("Stopping screen share.");
        cleanupScreenShare();
    }
}

// Improved cleanup function
function cleanupScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => {
            track.stop();
        });
        screenStream = null;
    }

    if (screenSharePeer) {
         // Use the screenSharePeer.id to find the element before destroying the peer
        const screenShareElement = document.querySelector('.stream[data-user-id="' + screenSharePeer.id + '"]');
        if (screenShareElement && screenShareElement.parentElement) {
            screenShareElement.remove();
            console.log(`Screen video element with data-user-id ${screenSharePeer.id} removed.`);
        } else {
            console.warn(`Screen video element with data-user-id ${screenSharePeer.id} not found or not attached during cleanup.`);
        }

        screenSharePeer.disconnect();
        screenSharePeer.destroy();
        screenSharePeer = null;
    } else {
         console.warn("screenSharePeer is null, cannot cleanup screen share element by ID.");
         // Fallback cleanup attempt if peer is null
         const screenShareElements = document.querySelectorAll('.stream');
         screenShareElements.forEach(el => {
              const nameElement = el.querySelector('.name-of-user');
              if (nameElement && nameElement.textContent.includes("(Screen)")) {
                  console.log(`Found screen share element by name fallback, removing.`);
                  const video = el.querySelector('video');
                   if (video && video.srcObject) {
                       video.srcObject.getTracks().forEach(track => track.stop());
                   }
                  el.remove();
              }
         });
    }

    screenVideoElement = null; // Ensure it's null
    isScreenSharing = false;

    // Update button style
    document.getElementById('screen-share-btn').style.background = "url('https://artemissssss.github.io/-------------------/img/sharewhite.png')";

    // Cleanup video grid to remove any potential empty screen share containers
    RemoveUnusedDivs();
    updateVideoLayout(); // Update layout after potential removal
}
//=====================================================================
let shouldStop = false;
let stopped = false;
// const videoElement = document.getElementsByTagName("video")[0]; // This might select the wrong video if multiple exist
const downloadLink = document.getElementById('download');
const audioRecordConstraints = {
    echoCancellation: true
}

const handleRecord = function({
    stream,
    mimeType
}) {
    let recordedChunks = [];
    stopped = false;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }

        if (shouldStop === true && stopped === false) {
            mediaRecorder.stop();
            stopped = true;
        }
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, {
            type: mimeType
        });
        recordedChunks = []
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `ЗаписЗустрічі.webm`;
        // videoElement.srcObject = null; // This might affect the main video
        downloadLink.click()
    };

    mediaRecorder.start(200);
};
let m = 0;
async function recordAudio() {
    if (m == 0) {
        const mimeType = 'audio/webm';
        shouldStop = false;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: audioRecordConstraints
            });
            handleRecord({
                stream,
                mimeType
            })
            m = 1;
        } catch (err) {
            console.error("Error accessing microphone for recording:", err);
            alert("Не вдалося отримати доступ до мікрофона для запису.");
        }
    } else {
        shouldStop = true;
        m = 0; // Reset m when stopping
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
        try {
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
            // videoElement.srcObject = stream; // This might affect the main video
            o = 0;
        } catch (err) {
            console.error("Error accessing screen for recording:", err);
             alert("Не вдалося отримати доступ до екрана для запису.");
             o = 1; // Reset o if recording fails
        }
    } else {
        shouldStop = true;
        o = 1;
    }
}
//====================================================================
// Modified addVideoStream to include user ID as a data attribute
const addVideoStream = (videoEl, stream, name, userId) => {
    console.log(`Adding video stream for user: ${name} (${userId})`);
    // Don't add video stream if op is false and it's not our own video
    if (name === "false") {
        console.log(`Skipping video stream for user ${userId} as op is false.`);
        return;
    }

    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('autoplay', '');
     videoEl.muted = true; // Mute by default to avoid echo

    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play().catch(err => {
            console.warn(`Playback failed for user ${userId}:`, err);
        });
    });

    const h1 = document.createElement("h2");
    const h1name = document.createTextNode(name);
    h1.className = "name-of-user"
    h1.appendChild(h1name);
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("video-grid");
    videoGrid.setAttribute('data-user-id', userId); // Add user ID for removal
    videoGrid.appendChild(h1);
    videoGrids.appendChild(videoGrid);
    videoGrid.append(videoEl);
    console.log(`Video grid added for user ID: ${userId}`);
    RemoveUnusedDivs();

    updateVideoLayout();
};
const updateVideoLayout = () => {
    const videosInGrid = videoGrids.getElementsByTagName("video");
    let totalInGrid = videosInGrid.length;
    if (totalInGrid > 0) { // Або totalInGrid > 1, якщо для одного відео не потрібна зміна ширини
        for (let i = 0; i < totalInGrid; i++) {
            videosInGrid[i].style.width = (100 / totalInGrid) + "%";
        }
    }
    // Додайте окрему логіку для оновлення розмірів відео в videoPin, якщо це потрібно,
    // або покладіться на CSS для їх стилізації.
};
// Modified addScreenStream to include user ID
const addScreenStream = (videoEl, stream, name, userId) => {
    console.log(`Adding screen stream for user: ${name} (${userId})`);
    videoEl.srcObject = stream;
    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });
    videoEl.muted = true; // Mute screen share audio by default
    const h1 = document.createElement("h2");
    const h1name = document.createTextNode(name);
    h1.className = "name-of-user"
    h1.appendChild(h1name);
    const videoGrid = document.createElement("div");
    videoGrid.classList.add("stream");
    videoGrid.setAttribute('data-user-id', userId); // Add user ID for removal
    videoGrid.appendChild(h1);
    videoPin.style.display = "flex"
    videoPin.appendChild(videoGrid);
    videoGrid.append(videoEl);
     console.log(`Screen stream added for user ID: ${userId}`);
    RemoveUnusedDivs();
    // Screen share layout might need different logic than video layout
    // This existing logic seems to affect all videos, might need adjustment.
    // let totalUsers = document.getElementsByTagName("video").length;
    // if (totalUsers > 1) {
    //     for (let index = 0; index < totalUsers; index++) {
    //         document.getElementsByTagName("video")[index].style.width =
    //             100 / totalUsers + "%";
    //         }
    //     }
};
let yx = 0;
document.getElementById("main_videos").addEventListener("dblclick", (e) => {
    // Find the closest parent with the class 'video-grid' or 'stream'
    const targetVideoContainer = e.target.closest('.video-grid') || e.target.closest('.stream');

    if (!targetVideoContainer) {
        return; // If the double click wasn't on a video container, do nothing
    }

    if (yx == 0) {
        $(targetVideoContainer).appendTo("#pinned")
            // Apply transform to the video element inside the container
        const videoElement = targetVideoContainer.querySelector('video');
        if (videoElement) {
             videoElement.style.transform = "scale(2.2)";
        }

        document.getElementById("pinned").style.display = "flex"
        yx = 1;
    } else {
        $(targetVideoContainer).appendTo("#video-grids") // Append back to videoGrids
         // Reset transform
        const videoElement = targetVideoContainer.querySelector('video');
        if (videoElement) {
             videoElement.style.transform = "scale(1)"; // Or remove the transform style
        }
        document.getElementById("pinned").style.display = "none" // Hide if pinned becomes empty
        yx = 0;
        updateVideoLayout(); // Update layout after moving
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
document.getElementById("id-conference").addEventListener("dblclick", () => {})

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
            roomVideoContainer.setAttribute('data-user-id', 'room-video'); // Add a unique ID for removal

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
                        // alert("Будь ласка, натисніть 'OK' для відтворення відео демонстрації екрана.");
                        // roomVideoElement.play().catch(err => console.error("Manual playback failed:", err));
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

