'use strict'
import RecursiveIterator from 'recursive-iterator'
export const isType = type => obj => Object.prototype.toString.call(obj) === `[object ${type}]`
export const isFn = isType('Function')
export const isArr = Array.isArray || isType('Array')
export const isObj = isType('Object')
export const isStr = isType('String')
export const isNum = isType('Number')
export const isIter = obj => (isArr(obj) || isObj(obj))
export const isForm = isType('FormData')
export const isFile = isType('File')
export const isUndefined = isType('Undefined')
export const isNull = isType('Null')
export const isNumber = isType('Number')


export const lowerCase = str => String(str).toLocaleLowerCase()

export const getMethod = (options) => lowerCase(options.method)

let { FormData } = window
let { toString } = Object.prototype

/**
 * Returns type of anything
 * @param {Object} any
 * @returns {String}
 */
function getType(any) {
    return toString.call(any).slice(8, -1);
}
/**
 * Converts path to FormData name
 * @param {Array} path
 * @returns {String}
 */
function toName(path) {
    let array = path.map((part) => `[${part}]`);
    array[0] = path[0];
    return array.join('');
}

/**
 * Converts object to FormData
 * @param {Object} object
 * @returns {FormData}
 */
export function json2formdata(object) {
    if (!isObj(object)) {
        throw new TypeError('Argument must be object');
    }

    let form = new FormData();
    let iterator = new RecursiveIterator(object);


    let appendToForm = function (path, node, filename) {
        let name = toName(path);
        if (isUndefined(filename)) {
            form.append(name, node);
        } else {
            form.append(name, node, filename);
        }
    };

    iterator.onStepInto = function ({ parent, node }) {

        let type = getType(node);
        switch (type) {
            case 'Array':
                return true; // step into
            case 'Object':
                return true; // step into
            case 'FileList':
                return true; // step into
            default:
                return false; // prevent step into
        }
    };

    for (let { node, path } of iterator) {
        var type = getType(node);
        switch (type) {
            case 'Array':
                break;
            case 'Object':
                break;
            case 'FileList':
                break;
            case 'File':
                appendToForm(path, node);
                break;
            case 'Blob':
                appendToForm(path, node, node.name);
                break;
            default:
                appendToForm(path, node);
                break;
        }
    }

    return form;
}

export function formdata2json(form) {
    const result = {}
    for (let key of form.keys()) {
        if (!result.hasOwnProperty(key)) {
            result[key] = form.get(key)
        } else {
            result[key] = form.getAll(key)
        }
    }
    return result
}

export const cleanMs = (str) => {
    return lowerCase(String(str)).replace(/\s+/ig, '')
}

const equalHeader = (key1, key2) => {
    return cleanMs(key1) === cleanMs(key2)
}

export const header = (target)=>{
    return cleanMs(isArr(target) ? target.join('/') : isStr(target) ? target : '')
}

export const getHeaderKeys = (headers) => {
    return Object.keys(headers || {})
}

export const hasHeader = (headers, key) => {
    if(!headers) return headers
    const keys = getHeaderKeys(headers)
    return keys.some($key => equalHeader($key, key))
}

export const findHeaderKey = (headers,key)=>{
    if(!headers) return headers
    const keys = getHeaderKeys(headers)
    for (let i = 0; i < keys.length; i++) {
        let value = headers[keys[i]]
        if (equalHeader(key, keys[i])) {
            return keys[i]
        }
    }
    return ''
}



export const getHeader = (headers, key) => {
    if(!headers) return headers
    return headers[findHeaderKey(headers,key)] || ''
}

export const removeHeader = (headers,key)=>{
    if(!headers) return headers
    const $key = findHeaderKey(headers,key)
    delete headers[$key]
    return headers
}

export const contentTypeIs = (options, target) => {
    if (!options) return false
    const { headers } = options
    const keys = getHeaderKeys(headers)
    if (hasHeader(headers, 'content-type')) {
        return getHeader(headers, 'content-type').indexOf(header(target)) > -1
    }

    return false
}

export const mergeHeaders = (oldHeaders, newHeaders) => {
    const oldKeys = getHeaderKeys(oldHeaders)
    const newKeys = getHeaderKeys(newHeaders)
    return newKeys.reduce((buf, key) => {
        const oldKey = findHeaderKey(buf,key)
        if (oldKey) {
            buf[oldKey] = newHeaders[key]
        }
        return buf
    }, oldHeaders || {})
}

export const process = (payload, previous, response) => {
    return Promise.resolve(previous(payload)).then((payload) => {
        return response(payload)
    })
}