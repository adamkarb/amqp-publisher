'use strict';

var amqp = require('amqplib');
// var EventEmitter = require('events');
// var colors = require('colors');

function Publisher(config) {

    var self = this;

    self.config = {
        host: config.host || 'amqp://localhost',
        quiet: config.quiet === true,
        name: (typeof config.name === 'string') ? config.name : 'Publisher'
    };

    self.queue = [];

    amqp.connect(self.config.host)
    .then(function(connection) {

        self.log('Publisher connected to amqp host');
        self.connection = connection;
        return self.connection.createChannel();

    })
    .then(function(channel) {

        self.channel = channel;
        return self.channel;

    })
    .then(function() {

        self.flushQueue();

    })
    .catch(function(err) {

        self.error(err);

    });

    return self;

}

Publisher.prototype.sendMessage = function(queue, data) {

    var self = this;

    var send = function() {

        return self.channel.assertQueue(queue)
        .then(function(ok) {

            var payload = typeof data === 'string' ? data : JSON.stringify(data);
            return self.channel.sendToQueue(queue, new Buffer(payload));

        })
        .catch(function(err) {
            return self.error(err);
        });

    };

    if (!self.connection) {

        self.queue.push(send.bind(self));

    } else {

        return send();

    }

};

Publisher.prototype.flushQueue = function() {

    var self = this;

    for (var i = 0, queueLen = self.queue.length; i < queueLen; i++) {

        self.queue[i]();

    }

};

Publisher.prototype.log = function(info) {

    var self = this;

    if (self.config.quiet === false) {
        console.log(`[ ${self.config.name} ] ${info}`);
    }

};

Publisher.prototype.error = function(err) {

    var self = this;

    if (self.config.quiet === false) {
        console.error(`[ ${self.config.name} ] ${err}`);
    }

};

Publisher.prototype.closeConnection = function() {

    var self = this;

    return self.connection.close()
    .then(function() {
        self.log('Closing connection...');
    });

};

Publisher.prototype.closeChannel = function() {

    var self = this;

    return self.channel.close()
    .then(function() {
        self.log('Closing channel...');
    });

};

Publisher.prototype.shutdown = function() {

    var self = this;

    var shutdown = function() {

        return self.closeChannel()
        .then(function() {
            return self.closeConnection();
        })
        .then(function() {
            self.log('Shutdown complete');
        })
        .catch(function(err) {
            return self.error(err);
        });

    };

    if (!self.connection) {

        // TODO: Potentially unshift because a shutdown is priority?
        self.queue.push(shutdown.bind(self));

    } else {

        shutdown();

    }

};

module.exports = Publisher;
