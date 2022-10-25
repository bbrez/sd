import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

const server = new WebSocketServer({
    port: 1234,
});


class UserSocket {
    user !: User;
    socket !: WebSocket;
}

let connections = new Array<UserSocket>();

//TODO logged user handling
async function main() {
    server.on('connection', async (socket) => {
        console.log("[new connection]");

        socket.on('message', async (msg) => {
            console.log('[received]:' + msg);

            let msgData = JSON.parse(msg.toString());

            switch (msgData.type) {
                case "register": {
                    //register new user
                    try {
                        let newUser = await prisma.user.create({
                            data: {
                                ...msgData.user,
                            }
                        });
                        console.log("Registered user: ", newUser);

                        socket.send(JSON.stringify({
                            result: "success",
                            user: newUser
                        }));
                        socket.close();
                    } catch (err) {
                        console.error("Error: ", err);
                        socket.send(JSON.stringify({
                            result: "error"
                        }));
                        socket.close();
                    }

                    break;
                };

                //login handler
                case "login": {
                    try {
                        let user = await prisma.user.findFirstOrThrow({
                            where: {
                                AND: [
                                    { name: msgData.user.name },
                                    { password: msgData.user.password },
                                ]
                            }
                        });

                        console.log("Loaded user: ", user);
                        socket.send(JSON.stringify({
                            result: "success",
                            user: { ...user, password: null }
                        }));
                    } catch (err) {
                        console.error(err);
                        socket.send(JSON.stringify({
                            result: "wrong_credentials"
                        }));
                    } finally {
                        socket.close();
                    }
                    break;
                };

                //connect handler
                case "connect": {
                    let user = await prisma.user.findFirstOrThrow({
                        where: {
                            name: msgData.user.name,
                        }
                    });

                    console.log("User found: ", user);

                    connections.push({
                        user: user,
                        socket: socket,
                    });

                    let ucs = await prisma.userChat.findMany({
                        where: {
                            userId: user.id
                        },

                        include: {
                            chat: {
                                include: {
                                    users: true,
                                    messages: {
                                        include: {
                                            from: true
                                        }
                                    }
                                }
                            },
                        }
                    });

                    console.log("Chats found: ", ucs);

                    socket.send(JSON.stringify({
                        result: "success",
                        type: "chat_list",
                        chats: [...ucs],
                    }));
                    break;
                }

                //new_chat handler
                case "new_chat": {
                    let user = await prisma.user.findFirstOrThrow({
                        where: {
                            name: msgData.chat.users[0].name
                        }
                    });

                    let newuc = await prisma.userChat.create({
                        data: {
                            nickname: user.name,
                            isAdmin: true,
                            user: {
                                connect: { id: user.id },
                            },
                            chat: {
                                create: {
                                    name: msgData.chat.name,
                                    icon: msgData.chat.icon,
                                }
                            }
                        }, include: {
                            user: true,
                            chat: true,
                        }
                    });

                    console.log("Chat registered: ", newuc);
                    socket.send(JSON.stringify({ result: "success", ...newuc.chat }));
                    break;
                }

                //add_user handler
                case "add_user": {
                    let user = await prisma.user.findFirstOrThrow({
                        where: {
                            name: msgData.userName,
                        },
                    });
                    console.log("found user: ", user);

                    let chat = await prisma.chat.findFirstOrThrow({
                        where: {
                            id: msgData.chat.id,
                        },
                        include: {
                            users: true,
                        }
                    });

                    console.log("found chat: ", chat);
                    if (chat.users.findIndex((u) => u.userId == user.id) != -1) {
                        console.log("user already in chat");
                        socket.send(JSON.stringify({
                            result: "error",
                        }))
                        return;
                    }

                    let newUC = await prisma.userChat.create({
                        data: {
                            nickname: user.name,
                            color: "#000000",
                            isAdmin: false,
                            chat: {
                                connect: {
                                    id: chat.id,
                                }
                            },
                            user: {
                                connect: {
                                    id: user.id,
                                }
                            }
                        },
                    });

                    console.log("added user to chat: ", newUC);
                    socket.send(JSON.stringify({
                        result: "success",
                        type: "user_added",
                        user: newUC,
                    }));
                    break;
                }

                case "chat_update": {
                    let admin = await prisma.userChat.findFirstOrThrow({
                        where: {
                            id: msgData.admin,
                            isAdmin: true,
                            chatId: msgData.chat.id,
                        },
                    });

                    let chat = await prisma.chat.update({
                        where: {
                            id: msgData.chat.id,
                        },
                        data: {
                            name: msgData.chat.name,
                            icon: msgData.chat.icon,
                        },
                    });

                    //TODO broadcast new info
                    break;
                }

                case "user_update": {
                    let uc = await prisma.userChat.update({
                        where: {
                            id: msgData.user.id
                        },
                        data: {
                            nickname: msgData.user.nickname,
                            color: msgData.user.color
                        }
                    });

                    //TODO broadcast new info
                    break;
                }

                case "remove_user": {
                    let admin = await prisma.userChat.findFirstOrThrow({
                        where: {
                            id: msgData.admin.id,
                            isAdmin: true,
                        },
                    });

                    console.log("admin found", admin);
                    let remove_uc = await prisma.userChat.delete({
                        where: {
                            id: msgData.removed.id
                        }
                    })

                    console.log("deleted user_chat:", remove_uc);
                    socket.send(JSON.stringify({
                        result: "success",
                        type: "user_removed",
                    }));

                    //TODO broadcast new info
                    break;


                }

                case "message": {
                    //send message to users;
                    let message = await prisma.message.create({
                        data: {
                            content: msgData.content,
                            timestamp: new Date(),
                            from: {
                                connect: {
                                    id: msgData.user,
                                },
                            },
                            to: {
                                connect: {
                                    id: msgData.chat,
                                },
                            },
                        },
                        include: {
                            to: {
                                include: {
                                    users: true,
                                },
                            },
                        },
                    });

                    console.log("new message: ", message);
                    console.log("broadcasting...");
                    connections.filter((c) => {
                        return message.to.users.findIndex((uc) => {
                            return uc.userId == c.user.id;
                        }) != -1;
                    }).map((con) => {
                        console.log("sending to: ", con.user.name);
                        con.socket.send(JSON.stringify({
                            type: "message",
                            to: message.chatId,
                            from: message.userChatId,
                            content: message.content,
                            when: message.timestamp,
                        }));
                    });
                    break;
                }

            }
        });

        socket.on('close', () => {
            console.log("[connection closed]");
            connections = connections.filter(c => c.socket !== socket);
        })
    })
};

main().then(async () => {
    await prisma.$disconnect()
}).catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});