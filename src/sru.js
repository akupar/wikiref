const getQueryString = (params) => {
    const out = [];
    for ( let key in params ) {
        out.push(key + "=" + encodeURIComponent(params[key]));
    }

    return out.join("&");
};

const queryEndpoint = async (endpoint, params) => {
    const url = endpoint + "?" + getQueryString(params);

    const resp = await fetch(url);
    if ( resp.status !== 200 ) {
        throw new Error(resp.statusText);
    }
    
    const data = await resp.text();
    if ( !data ) {
        throw new Error("no data");
    }

    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "application/xml");
    
    return xml;
};


export default {
    queryEndpoint,
};
