/**
 * ChatController.js
 *
 * @description :: It manages the chat conversations. One-to-One and group + the available conversation for a user.
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
module.exports = {

    /**
     * Description
     * @method direct
     * @param {} req
     * @param {} res
     * @return
     */
    direct: function (req, res) {
        var userId = req.param('userId');
        var message = req.param('message');
        var conversation;
        if (req.session.user.id > userId) {
            conversation = req.session.user.id + '-' + userId;
        }
        else
            conversation = userId + '-' + req.session.user.id;

        Message.create({
            message: message,
            type: 'direct',
            conversation: conversation,
            owner: req.session.user.id
        }).exec(function createCB(err, created) {
            console.log('Created message ');
        });
        SessionUser.findOne(userId).exec(function (err, sessionUser) {
            if (sessionUser)
                sessionUser.sockets.forEach(function (socket) {
                    sails.sockets.emit(socket, 'message', {from: req.session.user.id, msg: message});
                });
        });
    },
    historyDirect: function(req, res) {
        var userId = req.param('userId');
        var conversation;
        if (req.session.user.id > userId) {
            conversation = req.session.user.id + '-' + userId;
        }
        else
            conversation = userId + '-' + req.session.user.id;

        Message.find({where: {conversation: conversation}, sort: 'createdAt DESC', limit: 10}).exec(function(err, messages) {
            res.send(messages);
        });
    },
    /**
     * Description
     * @method room
     * @param {} req
     * @param {} res
     * @return
     */
    room: function (req, res) {
        var roomId = req.param('roomId');
        Group.findOne(roomId).exec(function findOneCB(err, found) {
            if (found) {
                return Group.message(roomId, {
                    room: {id: roomId},
                    from: req.session.user.id,
                    msg: req.param('message'),
                    timestamp: new Date()
                });
            }
        });
    },

    getConversation: function (req, res) {
        var type = req.param('type');
        var id = req.param('id');
        var conversation = id;
        if (type == 'direct') {
            if (req.session.user.id > id) {
                conversation = req.session.user.id + '-' + id;
            }
            else
                conversation = id + '-' + req.session.user.id;
        }


    },
    /**
     * Description
     * @method getConversations
     * @param {} req
     * @param {} res
     * @return
     */
    getConversations: function (req, res) {
        var sendUsers = [];
        Group.find({users: req.session.user.id}).exec(function (err, groups) {
            if (err) return res.serverError(err);
            groups.forEach(function (e) {
                Group.subscribe(req.socket, e.id);
            });
            User.find({company: req.session.user.company}).exec(function (err, users) {
                if (err) return res.serverError(err);
                var ids = [];
                users.forEach(function (element) {
                    if (element.id !== req.session.user.id) {
                        User.subscribe(req.socket, element.id, ['update']);
                        sendUsers.push({id: element.id, name: element.name, company: element.name});
                        ids.push({id: element.id});
                    }
                });
                var onlineUsers = [];
                SessionUser.find({
                    or: ids
                }).exec(function (err, sessionUsers) {
                    sessionUsers.forEach(function (el) {
                        onlineUsers.push(el.id);
                    });
                    res.json({
                        groups: groups,
                        users: sendUsers,
                        online: onlineUsers
                    });
                });
            });
        });
    },
    getContacts: function (req, res) {
        var sendUsers = [];
        Group.find({"users.id": req.session.user.id, type: 'private'}).exec(function (err, groups) {
            if (err) return res.serverError(err);
            groups.forEach(function (e) {
                Group.subscribe(req.socket, e.id);
            });
            User.find({contacts: req.session.user.id}).exec(function (err, users) {
                if (err) return res.serverError(err);

                var ids = [];
                if (users) {
                    users.forEach(function (element) {
                        if (element.id !== req.session.user.id) {
                            console.log('hduehuhde')
                            User.subscribe(req.socket, element.id, 'update');
                            sendUsers.push({id: element.id, name: element.name, avatar: element.avatar});
                            ids.push({id: element.id});
                        }
                    });
                    var onlineUsers = [];
                    SessionUser.find({
                        or: ids
                    }).exec(function (err, sessionUsers) {
                        sessionUsers.forEach(function (el) {
                            onlineUsers.push(el.id);
                        });
                        res.json({
                            groups: groups,
                            users: sendUsers,
                            online: onlineUsers
                        });
                    });
                }
            });
        });
    },
    getContactsProject: function (req, res) {
        console.log('fe');
        var projectId = req.param('projectId');
        console.log(projectId);
        Project.findOne(projectId).populate('groups').exec(function(err, project) {

            if(project && project.groups) {
                project.groups.forEach(function (e) {
                    Group.subscribe(req.socket, e.id);
                });
            }
            var sendUsers = [];
            User.find({projects: projectId}).exec(function(err, users) {
                if (users) {
                    var ids = [];
                    users.forEach(function (element) {
                        if (element.id !== req.session.user.id) {
                            User.subscribe(req.socket, element.id, ['update']);
                            sendUsers.push({id: element.id, name: element.name, company: element.name});
                            ids.push({id: element.id});
                        }
                    });
                    var onlineUsers = [];
                    SessionUser.find({
                        or: ids
                    }).exec(function (err, sessionUsers) {
                        sessionUsers.forEach(function (el) {
                            onlineUsers.push(el.id);
                        });
                        res.json({
                            users: sendUsers,
                            online: onlineUsers,
                            groups: project.groups
                        });
                    });
                }
            });
        });
    },
    getProjectGroups: function (req, res) {

    }
};