import _ from "lodash";
export {parseZmapGrid};

/**
 * parse zmap grid file
 * a contour data contain:
 * headers:
 *  - gridNodesPerPhysicalLine
 *  - nodeWidth
 *  - numNullValue
 *  - textNullValue
 *  - numOfDecimal
 *  - startCol
 *  - numOfRows
 *  - numOfCols
 *  - minX
 *  - maxX
 *  - minY
 *  - maxY
 * data: 2 dimensional array with size: numOfRows(rows) and numOfCols(cols)
 *
 */
function parseZmapGrid(fileContent) {
    const lines = fileContent.split("\n");
    let headerLineIdx = -1;
    let startReadData = false;
    const returnData = {
        data: [],
        headers: {}
    }
    for (let i = 0; i < lines.length; ++i) {
        let line = lines[i].trim()
        if (line.length == 0) continue;
        if (line.match(/^!/)) {
            // comment
            continue;
        } else if (line.match(/^@(Grid|GRID)/)) {
            headerLineIdx = 0;
            const lineData = line.split(",");
            returnData.headers["gridNodesPerPhysicalLine"] = Number(lineData[2]);
            continue;
        } else if (headerLineIdx == 0) {
            // read first header line
            const lineData = line.split(",");
            if (lineData.length) {
                returnData.headers["nodeWidth"] = Number(lineData[0]);
                returnData.headers["numNullValue"] = Number(lineData[1]);
                returnData.headers["textNullValue"] = Number(lineData[2]);
                returnData.headers["numOfDecimal"] = Number(lineData[3]);
                returnData.headers["startCol"] = Number(lineData[4]);

                headerLineIdx = 1;
            }
        } else if (headerLineIdx == 1) {
            // read second header line
            const lineData = line.split(",");
            if (lineData.length) {
                returnData.headers["numOfRows"] = Number(lineData[0]);
                returnData.headers["numOfCols"] = Number(lineData[1]);
                returnData.headers["minX"] = Number(lineData[2]);
                returnData.headers["maxX"] = Number(lineData[3]);
                returnData.headers["minY"] = Number(lineData[4]);
                returnData.headers["maxY"] = Number(lineData[5]);

                headerLineIdx = 2;
            }
        } else if (headerLineIdx == 2) {
            const lineData = line.split(",");
            if (lineData.length) {
                headerLineIdx = 3;
            }
        } else if (headerLineIdx >= 3 && line.match(/^@$/)) {
            // reading data
            startReadData = true;
            continue;
        } else if (startReadData) {
            const lineData = line.split(/\s+/);
            if (lineData.length) {
                if (returnData.data[returnData.data.length - 1]
                    && returnData.data[returnData.data.length - 1].length < returnData.headers["numOfRows"])
                    //concatinating new data
                    returnData.data[returnData.data.length - 1] = returnData.data[returnData.data.length - 1]
                        .concat(lineData.map(v => matchNullValue(v, returnData.headers["numNullValue"])));
                else if (returnData.data.length < returnData.headers["numOfCols"]) {
                    returnData.data.push(lineData.map(v => matchNullValue(v, returnData.headers["numNullValue"])))
                }
            }
            continue;
        } else if (headerLineIdx < 0) {
            continue;
        }
    }
    // transpose data for correct columns and rows
    returnData.data = _.zip.apply(_, returnData.data);
    return returnData;
}

function matchNullValue(v, nullValue) {
    const _value = Number(v);
    if (_value == nullValue) return null;
    return _value;
}
