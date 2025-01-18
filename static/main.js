if (window.location.href == "https://zustrich.artemissssss.de/join/" + roomId || window.location.href == "https://zustrich.artemissssss.de/join/" + roomId + "?" || window.location.href.includes(`https://zustrich.artemissssss.de/join/${roomId}?name=&surname=`)) {
    document.getElementById("form").style.display = "inline-block";
    document.getElementById("back").style.display = "inline-block"
    document.getElementById("id-meet").value = "/join/" + roomId;
}
const socket = io('wss://zustrich.artemissssss.de', {
    transports: ['websocket']
  });    const main__chat__window = document.getElementById("main__chat_window");
    const videoGrids = document.getElementById("video-grids");
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

    var peer = new Peer(undefined, {
        path: "/peerjs",
        host: "/",
        port: "3030",
    });
    let myVideoStream;
    const peers = {};
    var getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia;

    sendmessage = (text) => {
        if (event.key === "Enter" && text.value != "") {
            socket.emit("messagesend", myname + ":" + text.value);
            text.value = "";
            main__chat_window.scrollTop = main__chat_window.scrollHeight;
        }
    };

    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: true,
        })
        .then((stream) => {
            myVideoStream = stream;
            addVideoStream(myVideo, stream, myname);

            socket.on("user-connected", (id, username) => {
                connectToNewUser(id, stream, username);
                socket.emit("tellName", myname);
            });

            socket.on("user-disconnected", (id) => {
                console.log(peers);
                if (peers[id]) peers[id].close();
            });
        });
    peer.on("call", (call) => {
        getUserMedia({
                video: true,
                audio: true
            },
            function (stream) {
                call.answer(stream); // Answer the call with an A/V stream.
                const video = document.createElement("video");
                call.on("stream", function (remoteStream) {
                    addVideoStream(video, remoteStream, OtherUsername);
                });
            },
            function (err) {
                console.log("Failed to get local stream", err);
            }
        );
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
    };

    const connectToNewUser = (userId, streams, myname) => {
        const call = peer.call(userId, streams);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
            //   console.log(userVideoStream);
            addVideoStream(video, userVideoStream, myname);
        });
        call.on("close", () => {
            video.remove();
            RemoveUnusedDivs();
        });
        peers[userId] = call;
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
        videoEl.srcObject = stream;
        videoEl.addEventListener("loadedmetadata", () => {
            videoEl.play();
        });
        const h1 = document.createElement("h2");
        const h1name = document.createTextNode(name);
        h1.className = "name-of-user"
        h1.appendChild(h1name);
        const videoGrid = document.createElement("div");
        videoGrid.classList.add("video-grid");
        videoGrid.appendChild(h1);
        videoGrids.appendChild(videoGrid);
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
    document.getElementById("video-grids").addEventListener("dblclick", (e) => {
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
        // copyToClipboard("https://artem-video.herokuapp.com/join/"+roomId)
        copyToClipboard(`Посилання, щоб долучитися до конференції у зустрічі:\nВи можете зайти нас сайт zustrich.artemissssss.de та долучитися, за допомогою Id зустрічі /join/${roomId}.\nАбо перейдіть за посиланням https://zustrich.artemissssss.de/join/${roomId}.`)
    })
