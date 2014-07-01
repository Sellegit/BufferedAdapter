var BufferedActiveModelAdapter = DS.ActiveModelAdapter.extend({

    _buffer: {},

    _registerTasks: function(type, ids) {
        var typeKey = type.typeKey,
            bufferKey = this.buildURL(typeKey),
            buffer = this._buffer,
            executeTask = this._executeTask,
            adapter = this;
        if (buffer[bufferKey] !== undefined) {
            buffer[bufferKey].ids = Ember.A(buffer[bufferKey].ids.concat(ids)).uniq();
            return buffer[bufferKey].promise;
        }
        buffer[bufferKey] = {
            model: type,
            ids: ids
        }
         buffer[bufferKey].promise = new Ember.RSVP.Promise(function(resolve, reject) {
            Ember.run.later(this, function() {
                executeTask.call(adapter, typeKey, bufferKey).then(function(json) {
                    resolve(json);
                }, null);
            }, 35);
        });
        return buffer[bufferKey].promise;
    },

    _executeTask: function(typeKey, bufferKey, callback) {
        var buffer = this._buffer,
            promise = undefined,
            updateRecord = this.updateRecord;
        Ember.assert('\'' + bufferKey + '\' must be a valid key', buffer[bufferKey]);
        // if (buffer[bufferKey].ids.length === 1) {
        //     promise = this.ajax(this.buildURL(typeKey, buffer[bufferKey].ids[0]), 'GET');
        // } else {
        promise = this.ajax(bufferKey, 'GET', { data: { ids: buffer[bufferKey].ids } });
        // }
        delete buffer[bufferKey];
        return promise;
    },

    find: function(store, type, id) {
        var jsonKey = this.pathForType(type.typeKey);
        return this._registerTasks(type, [id]).then(function(json) {
            var json_data = json[jsonKey];
            Ember.assert('Should get json with ' + jsonKey, json_data);
            var obj = {};
            // if (Ember.typeOf(json_data) !== 'array') {
            //     Ember.assert('Should get json with id: ' + id, json_data.id == id);
            //     obj[jsonKey] = json_data;
            // } else {
            found_json = json_data.filter(function(item) {return item.id == id;});
            Ember.assert('Should get json with id: ' + id, found_json);
            obj[jsonKey] = found_json;
            // }
            return obj;
        }, null);
    },

    findMany: function(store, type, ids) {
        var jsonKey = this.pathForType(type.typeKey);
        return this._registerTasks(type, ids).then(function(json) {
            var json_data = json[jsonKey];
            Ember.assert('Should get json with ' + jsonKey, Ember.typoeOf(json_data) == 'array');
            var obj = {},
                found_json = Ember.A(json_data).filter(function(item) {
                    return ids.indexOf(item.id) !== -1;
                });
            obj[jsonKey] = found_json;
            return obj;
        }, null);
    }

});

export default BufferedActiveModelAdapter;
