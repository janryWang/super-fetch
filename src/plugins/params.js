/**
 * 
 * params插件，用于设置params
 * 
 */

import {
    isStr,
    isObj,
    isForm,
    getMethod,
    lowerCase,
    json2formdata,
    contentTypeIs,
    formdata2json,
    removeHeader
} from '../lang'
import qs from 'query-string'


const parseUrl = (url) => {
    const ac = document.createElement('a')
    ac.href = url
    return ac
}

const appendUrl = ({ query_string }) => (options, url, params) => {
    const ac = parseUrl(url)
    ac.search = query_string.stringify(params, options)
    return ac.href
}

const extractUrl = ({ query_string }) => (options, url) => {
    return query_string.parse(
        query_string.extract(parseUrl(url).search),
        options
    )
}


const extractParams = ({ query_string, form_data }) => (options, params) => {
    const result = {}
    if (isStr(params)) {
        return query_string.parse(params, options)
    } else if (isForm(params)) {
        return form_data.parse(params, options)
    } else if (isObj(params)) {
        return params
    } else {
        return result
    }
}



const transformParams = ({ query_string, form_data }) => (options, params) => {

    const is = type => contentTypeIs(options, type)

    if (is(['application', 'json'])) {
        return JSON.stringify(params)
    } else if (is(['multipart', 'formdata'])) {
        removeHeader(options.headers, 'content-type')
        return form_data.formify(params, options)
    } else if (is(['application', 'x-www-form-urlencoded'])) {
        return query_string.stringify(params, options)
    }
}

const filterParams = (params, names) => {
    return Object.keys(params || {}).reduce((buf, key) => {
        if (names.indexOf(key) == -1) {
            buf[key] = params[key]
        }
        return buf
    }, {})
}

const pickParams = (params, names) => {
    return Object.keys(params || {}).reduce((buf, key) => {
        if (names.indexOf(key) > -1) {
            buf[key] = params[key]
        }
        return buf
    }, {})
}

const createSerializer = (context, options) => (method, ...args) => {
    return method(context.post('serializer', options))(...args)
}

export const params = (params) => ({

    processSerializer(options) {
        return {
            query_string: {
                parse: qs.parse,
                stringify: qs.stringify,
                extract: qs.extract
            },
            form_data: {
                parse: formdata2json,
                formify: json2formdata
            }
        }
    },

    processOption(options, previous) {
        options = previous(options)

        const varNames = options.uri ? options.uri.varNames : []

        const serialize = createSerializer(this, options)

        params = serialize(extractParams, options, params)

        options.url = options.uri ? options.uri.fill(pickParams(params, varNames)) : options.url

        delete options.uri

        switch (getMethod(options)) {
            case 'get':

            case 'jsonp':

            case 'head':

                const url_params = Object.assign(
                    serialize(extractUrl, options, options.url),
                    filterParams(params, varNames)
                )

                options.url = serialize(appendUrl, options, options.url, url_params)
                return options


            default:

                options.body = serialize(transformParams, options,
                    Object.assign(
                        serialize(extractParams, options, options.body),
                        filterParams(params, varNames)
                    )
                )

                return options

        }

    }
})