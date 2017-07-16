'use strict';

var amqp = require('amqplib');
// var colors = require('colors');

function Publisher(config) {

    var self = this;

    self.config = {
        host: config.host || 'amqp://localhost',
        quiet: config.quiet === true,
        name: (typeof config.name === 'string') ? config.name : 'Publisher'
    };

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
    .catch(function(err) {

        self.error(err);

    });

    return self;

}

Publisher.prototype.sendMessage = function(queue, data) {

    var self = this;

    return self.channel.assertQueue(queue)
    .then(function(ok) {

        var payload = typeof data === 'string' ? data : JSON.stringify(data);
        return self.channel.sendToQueue(queue, new Buffer(payload));

    })
    .catch(function(err) {
        return self.error(err);
    });

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

    if (!self.connection) { throw new Error('Cannot close: No connection established.'); }

    self.log('Closing connection...');

    return self.connection.close()
    .then(function() {
        self.log('Connection closed.');
    });

};

Publisher.prototype.closeChannel = function() {

    var self = this;

    if (!self.channel) { throw new Error('Cannot close: No channel connected.'); }

    self.log('Closing channel...');

    return self.channel.close()
    .then(function() {
        self.log('Channel closed.');
    });

};

Publisher.prototype.shutdown = function() {

    var self = this;
    return self.closeChannel()
    .then(function() {
        return self.closeConnection();
    })
    .catch(function(err) {
        return self.error(err);
    });

};

module.exports = Publisher;
