import "@babel/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import config from './config.js';
import cgl from './cgl.js';
import sru from './sru.js';

const data = {
    xsl: {
        marcToEnglish: undefined,
        marcToKirjaviite: undefined,
        marcToCiteBook: undefined,        
    }
};

const state = {
    queryCache: {},
    selectedXSL: undefined,
};

window.queryCache = state.queryCache;

const assert = (bool, errMsg) => {
    if ( !bool ) {
        throw new Error("Assert failed: " + errMsg);
    }
};



const fetchXML = async (filename) => {
    const resp = await fetch(filename);
    const data = await resp.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(data, "application/xml");

    return xml;
};




const transformDocument = (xml, xsl) => {
    const xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    const resultDocument = xsltProcessor.transformToFragment(xml, document);

    return resultDocument;
};

const xmlStringToDocument = (xmlStr) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");
    return doc;
};


const makeQuery = async (cglQuery) => {
    const params = {
        query: cglQuery,
        version: "1.1",
        operation: "searchRetrieve",
        maximumRecords: 10,
        startRecord: 1
    };


    const queryResult = state.queryCache[cglQuery]
                     || await sru.queryEndpoint(config.ENDPOINT, params);
    
    state.queryCache[cglQuery] = queryResult;
    state.currentQuery = cglQuery;
    
    return queryResult;
};

const clearResults = () => {
    const resultDivs = document.getElementsByClassName("results");
    for ( let resultDiv of resultDivs ) {
        resultDiv.textContent = "";
    }
};

const showNumberOfRecords = (text) => {
    const infoDiv = document.getElementById('query-info');
    const num = parseInt(text, 10);
    const cap = Math.min(num, 10);
    if ( num > 0 ) {
        infoDiv.textContent = `Found ${num} records. Showing 1–${cap}.`;
    } else {
        infoDiv.textContent = `Found ${num}.`;        
    }
};

const parseNumberOfRecords = (doc) => {
    const root = doc.children;
    window.doc = doc;
};

const showResultInOutput = (queryResultDoc, xsl, resultsDiv) => {
    resultsDiv.textContent = "";

    parseNumberOfRecords(queryResultDoc);
    const numRecordsElems = queryResultDoc.getElementsByTagNameNS(
        "http://www.loc.gov/zing/srw/",
        "numberOfRecords"
    );

    if ( numRecordsElems.length > 0 ) {
        showNumberOfRecords(numRecordsElems[0].textContent);
    }

    
    const records = queryResultDoc.getElementsByTagNameNS("http://www.loc.gov/MARC21/slim", "record");
    let count = 1;
    for ( let record of records ) {
        if ( record !== records[0] ) {
            const divider = document.createElement('div');
            divider.setAttribute('class', 'result-divider');
            divider.appendChild(document.createTextNode(`Result ${count}`));
            resultsDiv.appendChild(divider);
        }
        const resultDocument = transformDocument(record, xsl);
        resultsDiv.appendChild(resultDocument);
        count++;
    }
}

const getCheckedCheckboxId = (groupName) => {
    const boxes = document.querySelectorAll(`input[name="${groupName}"]`);
    for ( let box of boxes ) {
        if ( box.checked ) {
            return box.id;
        }
    }
    return null;
};

const getSelectedOutput = () => {
    const selectedTabId = getCheckedCheckboxId('tab-elements');
    switch ( selectedTabId ) {
        case 'tab-1':
            return document.getElementById('results-kirjaviite');
        case 'tab-2':
            return document.getElementById('results-cite-book');
        case 'tab-6':
            return document.getElementById('results-english');
    }

    return null;
};

const getSelectedXSL = () => {
    const selectedTabId = getCheckedCheckboxId('tab-elements');
    switch ( selectedTabId ) {
        case 'tab-1':
            return data.xsl.marcToKirjaviite;
        case 'tab-2':
            return data.xsl.marcToCiteBook;
        case 'tab-6':
            return data.xsl.marcToEnglish;
    }
    return null;
};

const showResult = (result) => {
    const xsl = getSelectedXSL();
    if ( !xsl ) {
        return;
    }
    
    const outputDiv = getSelectedOutput();
    if ( !outputDiv ) {
        return;
    }

    state.queryResult = result;

    showResultInOutput(result, xsl, outputDiv);
};


const submitQuery = async () => {
    const rawQuery = document.getElementById('query-input').value;
    const isbn = document.getElementById('isbn-input').value;
    const creator = document.getElementById('creator-input').value;
    const title = document.getElementById('title-input').value;
    const publisher = document.getElementById('publisher-input').value;
    const date = document.getElementById('date-input').value;    
    
    let cglQuery;
    if ( rawQuery !== "" ) {
        cglQuery = rawQuery;
    } else {
        cglQuery = cgl.andQuery({
            isbn,
            creator,
            title,
            publisher,
            date,
        });
    }

    if ( !cglQuery || cglQuery === "" ) {
        return;
    }

    clearResults()

    try {
        const queryResult = await makeQuery(cglQuery);
        
        showResult(queryResult);
    } catch ( e ) {
        alert("Error: " + e);
    }
};



const tabSelected = async (event) => {
    if ( !state.queryResult ) {
        return;
    }

    showResult(state.queryResult);
};


const onLoad = async () => {
    data.xsl.marcToKirjaviite = await fetchXML('marc-to-Kirjaviite.xsl');
    data.xsl.marcToCiteBook = await fetchXML('marc-to-cite book.xsl');    
    data.xsl.marcToEnglish = await fetchXML('MARC21slim2English.xsl');

    document.forms['isbn-form'].onsubmit = (event) => {
        event.preventDefault();
        submitQuery();
        return false;
    };

    const tabButtons = document.querySelectorAll('input[name="tab-elements"]');
    for ( let tabButton of tabButtons ) {
        tabButton.addEventListener("click", tabSelected, false);
    }
    
};

document.addEventListener( "DOMContentLoaded", onLoad, false );
