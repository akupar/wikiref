const escape = (component) => {
    component = component.trim();

    let quote = false;
    const m = component.match(/^"(.*)"$/);
    if ( m ) {
        component = m[1];
        quote = true;
    }

    component = component.replaceAll('\\', '\\\\');
    component = component.replaceAll('"', '\\"');

    if ( component.search(/\s/) > -1 ) {
        quote = true;
    }

    if ( quote ) {
        return '"' + component + '"';
    }

    return component;
};


const andQuery = (values) => {
    const q = [];

    for ( let key in values ) {
        const value = values[key];
        if ( value ) {
            q.push(`${key} = ${escape(value)}`);
        }
    }
    
    return q.join(" and ");
};


export default {
    escape,
    andQuery,
};
