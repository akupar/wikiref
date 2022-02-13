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
        marcToMarc: 1
    }
};

const state = {
    queryCache: {},
    selectedRecord: undefined,
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
    if ( xsl === data.xsl.marcToMarc ) {
        const txt = document.createTextNode(xml.outerHTML);
        return txt;
    }
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

const unselectRecords = () => {
    const oldSels = document.getElementsByClassName('selected-record');
    for ( let oldSel of oldSels ) {
        oldSel.classList.remove('selected-record');
    }
    state.selectedRecord = undefined;
}

const selectRecordClass = (classId) => {
    const newSels = document.getElementsByClassName(classId);
    if ( newSels.length === 0 ) {
        return;
    }
    
    unselectRecords();

    for ( let newSel of newSels ) {
        newSel.classList.add('selected-record');
    }
    state.selectedRecord = classId;
}

const getChildOfClass = (resultsDiv, classId) => {
    for ( let i in resultsDiv.children ) {
        const child = resultsDiv.children[i];
        if ( child.classList.contains(classId) ) {
            return child;
        }
    }

    return null;
};

const scrollTo = (resultsDiv, classId) => {
    const recordElem = getChildOfClass(resultsDiv, classId);
    if ( !recordElem ) {
        return;
    }
    
    const topPos = recordElem.offsetTop;
    resultsDiv.scrollTop = topPos;
}


const showNumberOfRecords = (text) => {
    const messageSpan = document.getElementById('message');
    const num = parseInt(text, 10);
    const MAX = 10;
    const cap = Math.min(num, MAX);
    if ( num === 0 ) {
        messageSpan.textContent = `Löytyi 0 tietuetta.`;
    } else if ( num === 1 ) {
        messageSpan.textContent = `Löytyi 1 tietue.`;
    } else if ( num <= MAX ) {
        messageSpan.textContent = `Löytyi ${num} tietuetta.`;
    } else {
        messageSpan.textContent = `Löytyi ${num} tietuetta. Näytetään 1–${cap}.`;
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

    if ( xsl === data.xsl.marcToMarc ) {
        resultsDiv.appendChild(document.createTextNode('<container>\n'));
    }

    const records = queryResultDoc.getElementsByTagNameNS("http://www.loc.gov/MARC21/slim", "record");
    let count = 1;
    for ( let record of records ) {
        if ( record !== records[0] && xsl !== data.xsl.marcToMarc ) {
            const divider = document.createElement('div');
            divider.classList.add('result-divider');
            divider.appendChild(document.createTextNode(`Result ${count}`));
            resultsDiv.appendChild(divider);
        }

        const resultDocument = transformDocument(record, xsl);
        const container = document.createElement('div');
        container.appendChild(resultDocument);
        container.classList.add(`record-${count}`);
        resultsDiv.appendChild(container);
        container.onclick = (event) => {
            selectRecordClass(event.target.getAttribute('class'));
        };
        count++;
    }

    if ( xsl === data.xsl.marcToMarc ) {
        resultsDiv.appendChild(document.createTextNode('</container>\n'));
    }

    if ( state.selectedRecord ) {
        selectRecordClass(state.selectedRecord);
        scrollTo(resultsDiv, state.selectedRecord);
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
        case 'tab-3':
            return document.getElementById('results-xml');
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
        case 'tab-3':
            return data.xsl.marcToMarc;
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
            identifier: isbn,
            creator,
            title,
            publisher,
            date,
        });
    }

    if ( !cglQuery || cglQuery === "" ) {
        return;
    }

    document.getElementById('loading').style.display = 'inline-block';
    
    const messageSpan = document.getElementById('message');    
    messageSpan.textContent = "";
    clearResults()
    unselectRecords();

    try {
        const queryResult = await makeQuery(cglQuery);

        showResult(queryResult);
        document.getElementById('loading').style.display = 'none';
    } catch ( e ) {
        alert("Error: " + e);
        document.getElementById('loading').style.display = 'none';
    }
};



const tabSelected = async (event) => {
    if ( !state.queryResult ) {
        return;
    }

    showResult(state.queryResult);
};


const onLoad = async () => {
    document.getElementById('loading').style.display = 'none';

    if ( location.search === "?debug=1" ) {
        for ( let elem of document.querySelectorAll('.debug') ) {
            if ( [ "DIV" ].indexOf(elem.tagName) !== -1 ) {
                elem.style.display = 'block';
            } else {
                elem.style.display = 'inline';
            }
        }
    }

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
