const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const peer = new Peer(undefined, {
    path: "/peerjs",
    host: "/",
    port: "3030",
}); 1
const peers = {};

let myVideoStream;
var currentPeer;

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
        addVideoStream(myVideo, stream);

        peer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");

            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream);
                currentPeer = call.peerConnection;
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

        socket.on("createMessage", (msg) => {
            console.log(msg);
            let li = document.createElement("li");
            li.innerHTML = msg;
            all_messages.append(li);
            main__chat__window.scrollTop = main__chat__window.scrollHeight;
        });
    });

peer.on("call", function (call) {
    getUserMedia(
        { video: true, audio: true },
        function (stream) {
            call.answer(stream); // Answer the call with stream.
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                addVideoStream(video, remoteStream);
                currentPeer = call.peerConnection
            });
        },
        function (err) {
            console.log("Failed to get local stream", err);
        }
    );
});

peer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});
socket.on("disconnect", function () {
    socket.emit("leave-room", ROOM_ID, currentUserId);
    video.remove();
});


const ShowChat = (e) => {
    e.classList.toggle("active");
    document.body.classList.toggle("showChat");
};
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
        let videoTrack = stream.getVideoTracks()[0];
        let sender = currentPeer.getSender().find(function (e) {
            return s.track.kind == videoTrack.kind
        })
        sender.replaceTrack(videoTrack)
    }).catch((err) => {
        console.log("unable to get display media" + err)
    })
})

//invite others
const inviteButton = document.querySelector('.main__invite_button');
inviteButton.addEventListener("click", (e) => {
    navigator.clipboard.writeText(window.location.href);
    alert("Invite link copied to clipboard! Send it to students who also like to join the lesson");
});


// CHAT

const connectToNewUser = (userId, streams) => {
    var call = peer.call(userId, streams);
    console.log(call);
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


