'use strict';

var amqp = require('amqplib');
// var colors = require('colors');

function Publisher(config) {

    if (!config.url) {
        throw new Error('No amqp url provided!');
    }

    var self = this;

    self.config = {};
    self.config.url = config.url || null
    self.config.quiet = config.quiet === true;
    self.config.name = typeof config.name === 'string' ? config.name : 'Publisher';

    amqp.connect(self.config.url)
    .then(function(connection) {

        self.log(`:: ${self.config.name} publisher connected to amqp host ::`);

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

    if (self.config.quiet === false) {
        console.log(info);
    }

};

Publisher.prototype.error = function(err) {

    var self = this;

    if (self.config.quiet === false) {
        console.error(err);
    }

};

module.exports = Publisher;
