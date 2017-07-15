'use strict';

var amqp = require('amqplib');
// var colors = require('colors');

function Publisher(config) {

    var self = this;

    self.config = {};
    self.config.url = config.url || throw new Error('No amqp host provided!');
    self.config.quiet = config.quiet === true;
    self.config.name = config.name || 'Publisher';

    amqp.connect(self.url)
    .then(function(connection) {

        self.connection = connection;
        return self.connection.createChannel();

    })
    .then(function(channel) {

        self.channel = channel;
        return self.channel;

    })
    .catch(function(err) {

        console.error(err);

    });

}

Publisher.prototype.delegateJob = function(queue, data) {

    var self = this;

    return self.channel.assertQueue(queue)
    .then(function(ok) {

        var payload = typeof data === 'string' || JSON.stringify(data);
        return self.channel.sendToQueue(queue, new Buffer(payload));

    })
    .catch(self.error);

};

Publisher.prototype.log = function(info) {

    var self = this;

    if (this.quiet === false) {
        self.log(info);
    }

};

Publisher.prototype.error = function(err) {

    var self = this;

    if (this.quiet === false) {
        self.error(err);
    }

};

module.exports = Publisher;
