/*
 * Holds reusable generic objects to
 * prevent memory leakage and improve
 * GC performance
 * 
 * ObjStack.init(20);
 * let newObj = ObjStack.pop();
 * ObjStack.push(newObj);
 *
 * @module Singleton
 * @type {{get, return}}
 */
export const ObjStack = (function () {
    const _objects = [];

    const _init = function (n) {
        for (let i = 0; i < n; i++) {
            _objects.push({});
        }
    };
    // pop one off the stack
    const _pop = function () {
        return _objects.pop();
    };

    const _push = function (obj) {
        // clear obj properties
        Object.keys(obj).map(function (key) {
            delete obj[key];
        });
        // put back on the stack
        _objects.push(obj);
    };

    return {
        init: _init,
        pop: _pop,
        push: _push
    };
})();