'use strict';

const _ = require('lodash');

module.exports = class TestCollection {
    static create(...args) {
        return new this(...args);
    }

    constructor(specs) {
        // this._originalSpecs = specs;
        Object.defineProperty(this, '_originalSpecs', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: specs
        });

        // this._specs = _.mapValues(specs, _.clone);
        Object.defineProperty(this, '_specs', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: _.mapValues(specs, _.clone)
        });

        for (let browserId in specs) {
            const root = this.getRootSuite(browserId);
            if (root) {
                this[browserId] = root;
            }
        }
    }

    getRootSuite(browserId) {
        const test = this._originalSpecs[browserId][0];
        return test && test.parent && this._getRoot(test.parent);
    }

    _getRoot(suite) {
        return suite.root ? suite : this._getRoot(suite.parent);
    }

    getBrowsers() {
        return Object.keys(this._specs);
    }

    mapTests(browserId, cb) {
        if (_.isFunction(browserId)) {
            cb = browserId;
            browserId = undefined;
        }

        const results = [];
        this.eachTest(browserId, (test, browserId) => results.push(cb(test, browserId)));

        return results;
    }

    eachTest(browserId, cb) {
        if (_.isFunction(browserId)) {
            cb = browserId;
            browserId = undefined;
        }

        if (browserId) {
            this._specs[browserId].forEach((test) => cb(test, browserId));
        } else {
            this.getBrowsers().forEach((browserId) => this.eachTest(browserId, cb));
        }
    }

    disableAll(browserId) {
        if (browserId) {
            this._specs[browserId] = this._originalSpecs[browserId].map((test) => this._mkDisabledTest(test));
        } else {
            this.getBrowsers().forEach((browserId) => this.disableAll(browserId));
        }

        return this;
    }

    _mkDisabledTest(test) {
        return _.extend(Object.create(test), {pending: true, silentSkip: true});
    }

    disableTest(fullTitle, browserId) {
        if (browserId) {
            const idx = this._findTestIndex(fullTitle, browserId);
            if (idx !== -1) {
                this._specs[browserId].splice(idx, 1, this._mkDisabledTest(this._originalSpecs[browserId][idx]));
            }
        } else {
            this.getBrowsers().forEach((browserId) => this.disableTest(fullTitle, browserId));
        }

        return this;
    }

    _findTestIndex(fullTitle, browserId) {
        return this._specs[browserId].findIndex((test) => test.fullTitle() === fullTitle);
    }

    enableAll(browserId) {
        if (browserId) {
            this._specs[browserId] = _.clone(this._originalSpecs[browserId]);
        } else {
            this.getBrowsers().forEach((browserId) => this.enableAll(browserId));
        }

        return this;
    }

    enableTest(fullTitle, browserId) {
        if (browserId) {
            const idx = this._findTestIndex(fullTitle, browserId);
            if (idx !== -1) {
                this._specs[browserId].splice(idx, 1, this._originalSpecs[browserId][idx]);
            }
        } else {
            this.getBrowsers().forEach((browserId) => this.enableTest(fullTitle, browserId));
        }

        return this;
    }
};