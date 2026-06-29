
const baseURL = 'http://localhost:3000'
const token = `user ${localStorage.getItem("token")}`;
let globalProfile = {};
let Groups = [];

const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'authorization': token
};
const clintIo = io(baseURL, {
    auth: { authorization: token }
})

// clintIo.on("connect", () => {
//     console.log("connected");

//     Groups.forEach(Group => {
//         clintIo.emit("room", {
//             roomId: Group.roomId,
//         });
//     });
// });

clintIo.on("connect_error", (err) => {
    console.log("connect_error:", err.message);
});

clintIo.on("custom_error", (err) => {
    console.log("custom_error:", err.message);
});

clintIo.emit("sayHi", "FROM FE TO BE", (response) => {
    console.log({ response });
})
clintIo.on("offline_user", data => {
    console.log({ data });
})



// clintIo.on("likePost", data => {
//     console.log({ likeData: data })
// })


//images links
let avatar = './avatar/Avatar-No-Background.png'
let meImage = './avatar/Avatar-No-Background.png'
let friendImage = './avatar/Avatar-No-Background.png'


// // // // // // collect messageInfo
function sendMessage(sendTo, type) {
    console.log({ sendTo, type });
    if (type == "ovo") {
        const data = {
            content: $("#messageBody").val(),
            sendTo,
        }
        console.log({ data });

        clintIo.emit('sendMessage', data)
    } else if (type == "group") {
        const data = {
            content: $("#messageBody").val(),
            groupId: sendTo,
        }
        clintIo.emit('sendGroupMessage', data)

    }

}

// // // // // //sendCompleted
clintIo.on('successMessage', (data) => {

    const { conversation } = data;

    document.getElementById('messageList').innerHTML = '';

    conversation.messages.forEach(message => {

        const div = document.createElement('div');

       if (message.createdBy._id.toString() === globalProfile._id.toString()) {

            div.className = 'me text-end p-2';
            div.dir = 'rtl';

            const imagePath = globalProfile.profilePicture
                ? `${baseURL}/upload/${globalProfile.profilePicture}`
                : avatar;

            div.innerHTML = `
                <img class="chatImage" src="${imagePath}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
            `;

        } else {

            div.className = 'myFriend p-2';
            div.dir = 'ltr';

            div.innerHTML = `
                <img class="chatImage" src="${friendImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
            `;
        }

        document.getElementById('messageList').appendChild(div);
    });

    $(".noResult").hide();
    $("#messageBody").val('');
});

// // // // // // // // // //receiveMessage
clintIo.on("newMessage", (data) => {

    console.log({ RM: data });

    const { conversation, from, groupId } = data;

    const onclickAttr =
        document.getElementById("sendMessage")?.getAttribute("onclick");

    const [, currentOpenedChat] =
        onclickAttr?.match(/sendMessage\('([^']+)'/) || [];

    const isOpenChat =
        (!groupId && currentOpenedChat === from._id) ||
        (groupId && currentOpenedChat === groupId);

    // ============== CHAT OPEN ==============
    if (isOpenChat) {

        document.getElementById('messageList').innerHTML = '';

        conversation.messages.forEach(message => {

            const div = document.createElement('div');

            const isMe =
                 message.createdBy._id.toString() === globalProfile._id.toString();

            if (isMe) {

                div.className = 'me text-end p-2';
                div.dir = 'rtl';

                const imagePath = globalProfile.profilePicture
                    ? `${baseURL}/upload/${globalProfile.profilePicture}`
                    : avatar;

                div.innerHTML = `
                    <img class="chatImage" src="${imagePath}">
                    <span class="mx-2">${message.content}</span>
                `;

            } else {

                div.className = 'myFriend p-2';
                div.dir = 'ltr';

                const friendImg = from?.profilePicture
                    ? `${baseURL}/upload/${from.profilePicture}`
                    : avatar;

                div.innerHTML = `
                    <img class="chatImage" src="${friendImg}">
                    <span class="mx-2">${message.content}</span>
                `;
            }

            document.getElementById('messageList').appendChild(div);
        });

    }

    // ============== CHAT CLOSED (NOTIFICATION) ==============
    else {

        if (groupId) {
            $(`#g_${groupId}`).show();
        } else {
            $(`#c_${from._id}`).show();
        }

        const audio = document.getElementById("notifyTone");
        audio.currentTime = 0;
        audio.play().catch(err => console.log("Audio blocked:", err));
    }
});


// // // // // // // ******************************************************************** Show chat conversation
function showData(sendTo, chat) {
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "ovo")`);

    document.getElementById('messageList').innerHTML = ''
    if (chat.messages?.length) {
        $(".noResult").hide()
        for (const message of chat.messages) {

            if (message.createdBy.toString() == globalProfile._id.toString()) {
                const div = document.createElement('div');
                div.className = 'me text-end p-2';
                div.dir = 'rtl';
                div.innerHTML = `
                <img class="chatImage" src="${meImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            } else {

                const div = document.createElement('div');
                div.className = 'myFriend p-2';
                div.dir = 'ltr';
                div.innerHTML = `
                <img class="chatImage" src="${friendImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            }

        }
    } else {
        const div = document.createElement('div');

        div.className = 'noResult text-center  p-2';
        div.dir = 'ltr';
        div.innerHTML = `
        <span class="mx-2">Say Hi to start the conversation.</span>
        `;
        document.getElementById('messageList').appendChild(div);
    }

    $(`#c_${sendTo}`).hide();


}

// // // // // // // // //get chat conversation between 2 users and pass it to ShowData fun
function displayChatUser(userId) {
    console.log({ userId });
    axios({
        method: 'get',
        url: `${baseURL}/auth/${userId}/chat`,
        headers
    }).then(function (response) {
        console.log({ response });
        const  chat  = response.data.data

        console.log(chat);
        if (chat) {
            if (chat.participants[0]._id.toString() == globalProfile._id.toString()) {
                meImage = chat.participants[0].profilePicture ? `${baseURL}/upload/${chat.participants[0].profilePicture}` : avatar
                friendImage = chat.participants[1].profilePicture ? `${baseURL}/upload/${chat.participants[1].profilePicture}` : avatar
            } else {
                meImage = chat.participants[1].profilePicture ? `${baseURL}/upload/${chat.participants[1].profilePicture}` : avatar
                friendImage = chat.participants[0].profilePicture ? `${baseURL}/upload/${chat.participants[0].profilePicture}` : avatar
            }

            showData(userId, chat)
        } else {
            showData(userId, 0)
        }

    }).catch(function (error) {
        console.log(error);
        console.log({ status: error.status });
        if (error.status == 400) {
            showData(userId, 0)
        } else {
            alert("Ops something went wrong")
        }

    });
}

// // ********************************************************************
// // // ******************************************************************** Show  group chat conversation
function showGroupData(sendTo, chat) {
    document.getElementById("sendMessage").setAttribute("onclick", `sendMessage('${sendTo}' , "group")`);

    document.getElementById('messageList').innerHTML = ''
    if (chat.messages?.length) {
        $(".noResult").hide()
        console.log(chat.messages);

        for (const message of chat.messages) {

            if (message.createdBy?._id.toString() == globalProfile._id.toString()) {
                const div = document.createElement('div');
                div.className = 'me text-end p-2';
                div.dir = 'rtl';
                div.innerHTML = `
                <img class="chatImage" src="${meImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            } else {

                const div = document.createElement('div');
                div.className = 'myFriend p-2';
                div.dir = 'ltr';
                const friendImage = message.createdBy.profilePicture ? `${baseURL}/upload/${message.createdBy.profilePicture}` : avatar
                div.innerHTML = `
                <img class="chatImage" src="${friendImage}" alt="" srcset="">
                <span class="mx-2">${message.content}</span>
                `;
                document.getElementById('messageList').appendChild(div);
            }

        }
    } else {
        const div = document.createElement('div');

        div.className = 'noResult text-center  p-2';
        div.dir = 'ltr';
        div.innerHTML = `
        <span class="mx-2">Say Hi to start the conversation.</span>
        `;
        document.getElementById('messageList').appendChild(div);
    }
    $(`#g_${sendTo}`).hide();


}
// // // // ********************************************************************
function displayGroupChat(groupId) {
    console.log({ groupId });
    axios({
        method: 'get',
        url: `${baseURL}/chat/group/${groupId}`,
        headers
    }).then(function (response) {
        const  chat  = response.data?.data
        console.log({ chat });
        if (chat) {
            meImage = globalProfile.profilePicture ? `${baseURL}/upload/${globalProfile.profilePicture}` : avatar
            showGroupData(groupId, chat)
        } else {
            showGroupData(groupId, 0)
        }

    }).catch(function (error) {
        console.log(error);
        console.log({ status: error.status });
        if (error.status == 404) {
            showGroupData(groupId, 0)
        } else {
            alert("Ops something went wrong")
        }

    });
}
// // ==============================================================================================


// // // // // // ********************************************************* Show Users list 
// // // // // Display Users
function getUserData() {
    axios({
        method: 'get',
        url: `${baseURL}/auth/profile`,
        headers
    }).then(function (response) {
        console.log({ D: response.data });
        const   user  = response.data?.data;
        const   groups  = response.data?.groups;
        Groups = groups
        console.log({ user });
console.log("groups:", groups);  
        globalProfile = user;
        let imagePath = avatar;
        if (user.profilePic) {
             imagePath = `${baseURL}/auth/get-file/${user.profilePic}`;
        }
        document.getElementById("profileImage").src = imagePath
        document.getElementById("userName").innerHTML = `${user.userName}`
        showUsersData(user.friends)
        showGroupList(groups)
    }).catch(function (error) {
        console.log(error);
    });
}
// // // // // Show friends list
function showUsersData(users = []) {
    let cartonna = ``
    for (let i = 0; i < users.length; i++) {
        let imagePath = avatar;
        if (users[i].profilePic) {
            imagePath = `${baseURL}/upload/${users[i].profilePic}`
        }
        cartonna += `
        <div onclick="displayChatUser('${users[i]._id}')" class="chatUser my-2">
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="ps-2">${users[i].userName}</span>
        <span id="${"c_" + users[i]._id}" class="ps-2 closeSpan">
           🟢
        </span>
    </div>

        `
    }


    document.getElementById('chatUsers').innerHTML = cartonna;
}

// // // // Show groups list
function showGroupList(groups = []) {
    let cartonna = ``
    console.log("groups length:", groups.length);

    for (let i = 0; i < groups.length; i++) {
    console.log("connected:", clintIo.connected);
    console.log("socket id:", clintIo.id);
    console.log("emit room:", groups[i].roomId);

        let imagePath = avatar;
        if (groups[i].groupImage) {
            imagePath = `${baseURL}/upload/${groups[i].groupImage}`
        }
        cartonna += `
        <div onclick="displayGroupChat('${groups[i]._id}')" class="chatUser my-2">
        <img class="chatImage" src="${imagePath}" alt="" srcset="">
        <span class="ps-2">${groups[i].group}</span>
           <span id="${"g_" + groups[i]._id}" class="ps-2 closeSpan">
           🟢
        </span>
    </div>
        `
        if (clintIo.connected){
        console.log("before emit", groups[i].roomId);

        clintIo.emit("join_room", { roomId: groups[i].roomId })
        console.log("after emit💡💡💡💡");

        }
        else {
                    console.log("😒😒😒😒😒");

        }

    }


    document.getElementById('chatGroups').innerHTML = cartonna;
}


getUserData()




