const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const chatMessagesBox = document.getElementById("chat_box");

const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

// globals for MediaRecorder

let mediaRecorder;
let recordedBlobs;

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
});

const peers = {};
var peerList = [];
var currentPeer = null;
var isRecording = false;


let myVideoStream;

var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {

        myVideoStream = stream;
        window.stream = stream;

        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            currentPeer = call;

            call.on("stream", (userVideoStream) => {
                if (!peerList.includes(call.peer)) {
                    addVideoStream(video, userVideoStream);
                    peerList.push(call.peer);
                }

            });
        });

        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
        socket.on("user-disconnected", (userId) => {
            if (peers[userId]) peers[userId].close();
        });

        document.addEventListener("keydown", (e) => {
            if (e.which === 13 && chatInputBox.value != "") {
                socket.emit("message", chatInputBox.value);
                chatInputBox.value = "";
            }
        });

        record__Btn.addEventListener("click", (e) => {
            !isRecording ? startRecording() : stopRecording()
        })


        share__Btn.addEventListener("click", (e) => {
            navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            }).then((stream) => {
                const screenStream = stream;
                window.stream = stream;

                let videoTrack = screenStream.getVideoTracks()[0];

                if (peer) {
                    console.log("Current Peer", currentPeer);
                    var video = document.createElement("video");
                    addVideoStream(video, stream);

                    let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    })
                    sender.replaceTrack(videoTrack)
                    screenSharing = true
                }

            }).catch((err) => {
                console.log("unable to get display media" + err)
            })
        })
    });

peer.on("call", function (call) {
    getUserMedia(
        { video: true, audio: true },
        function (stream) {
            currentPeer = call
            call.answer(stream); // Answer the call with stream.
            console.log("Init window stream with stream")
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                if (!peerList.includes(call.peer)) {
                    addVideoStream(video, remoteStream);
                    peerList.push(call.peer);
                }
            });
        },
        function (err) {
            console.log("Failed to get local stream", err);
        }
    );
});


const ShowChat = () => {
    console.log("show chat")
    console.log(chatMessagesBox.style.visibility)
    if (chatMessagesBox.style.display == "none") {
        chatMessagesBox.style.display = "";
    } else {
        chatMessagesBox.style.display = "none";
    }

};


peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});
socket.on("disconnect", function () {
    socket.emit("leave-room", ROOM_ID, currentUserId);
    video.remove();
});
socket.on("createMessage", (msg) => {
    console.log(msg);
    let li = document.createElement("li");
    li.innerHTML = msg;
    all_messages.append(li);
    main__chat__window.scrollTop = main__chat__window.scrollHeight;
});



//invite others
const inviteButton = document.querySelector('.main__invite_button');
inviteButton.addEventListener("click", (e) => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied to clipboard! Send it to students who also like to join the lesson");
});


// CHAT

const connectToNewUser = (userId, streams) => {
    var call = peer.call(userId, streams);
    currentPeer = call;
    var video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        console.log(userVideoStream);
        addVideoStream(video, userVideoStream);
    })
    call.on('close', () => {
        video.remove()

    })

    peers[userId] = call;
}

const addVideoStream = (videoEl, stream) => {

    videoEl.srcObject = stream;

    videoEl.addEventListener("loadedmetadata", () => {
        videoEl.play();
    });

    videoGrid.append(videoEl);
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 1) {
        for (let index = 0; index < totalUsers; index++) {
            document.getElementsByTagName("video")[index].style.width =
                100 / totalUsers + "%";
        }
    }
};

const playStop = () => {
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

//exit button 

const exitButton = document.querySelector('.leaveMeeting');

exitButton.addEventListener("click", (e) => {
    if (confirm("Are you sure?")) {
        var win = window.open("leaveMeeting.html", "_self");
        win.close();
    }
});

const setPlayVideo = () => {
    const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
    const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
    document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
    const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
    const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
    document.getElementById("muteButton").innerHTML = html;
};



//Video recording

function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

const startRecording = () => {

    const VIDEO_WIDTH = 1280
    const VIDEO_HEIGHT = 1024
    var numStreams = 0
    var curStream = 0


    var merger = new VideoStreamMerger({
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT
    })

    merger.start()

    document.getElementById("iconRecord").className = "fa fa-square";
    document.getElementById("recordLabel").innerText = "Stop Recording"


    const videoList = document.querySelectorAll('video');

    const videTags = [...videoList]; // converts NodeList to Array
    videTags.forEach(video => {
        const curStream = numStreams
        merger.addStream(video.srcObject, {
            mute: numStreams > 0,
            draw: function (ctx, frame, done) {
                if (curStream >= numStreams) curStream = 0

                ctx.drawImage(frame, VIDEO_WIDTH * curStream, 0, VIDEO_WIDTH, VIDEO_HEIGHT)

                done()
            }
        })

        numStreams++
        merger.setOutputSize(numStreams * VIDEO_WIDTH, VIDEO_HEIGHT)

    });




    isRecording = true;
    recordedBlobs = [];
    const mimeType = "video/webm;codecs=vp9,opus";
    const options = { mimeType };

    try {
        mediaRecorder = new MediaRecorder(merger.result, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);

    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
        downloadFile();
        isRecording = false;
        merger.destroy();

    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    document.getElementById("iconRecord").className = "fa fa-circle";
    document.getElementById("recordLabel").innerText = "Start Recording"
    mediaRecorder.stop();
}

function downloadFile() {

    //Download file
    const blob = new Blob(recordedBlobs, { type: 'video/webm' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    var datetime = new Date();

    a.download = datetime + 'Session.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}
