import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import _ from "lodash";
import template from "./template.html";
import "../../vendors/ctxtextpath";
const componentName = "contour-view";

const component = {
    props: [
        'values', "contourUnit",
        "nRows", "nCols", "colorScale", "step", "majorEvery",
        "labelFontSize", "incXDirection", "incYDirection",
        "showGrid", "gridMajor", "gridMinor", "gridNice",
        "minX", "maxX", "minY", "maxY",
        'onScaleChanged', 'yDirection', "showScale",
        'wells', "showWell",
        'trajectories', 'showTrajectory',
        "showColorScaleLegend", 'colorLegendTicks',
        "negativeData", "showLabel", "labelInterval",
        'onComponentMounted'
    ],
    template,
    mounted() {
        this.$nextTick(() => {
            this.__contour = initContour(this.$refs.drawContainer, this.dataFn);
            if (typeof(this.onComponentMounted) == 'function')
                this.onComponentMounted(this);
        })
    },
    watch: {
        values: {
            handler: function(val) {
                // console.log("vue - values changed");
                updateContourData(this.$refs.drawContainer, this.dataFn, 'all');
            },
            deep: false,
        },
        colorScale: function() {
            // console.log("vue - colorScale changed")
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'color');
        },
        step: function(val) {
            // console.log("vue - onStep changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'path');
        },
        majorEvery: function(val) {
            // console.log("vue - majorEvery changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showLabel: function(val) {
            // console.log("vue - showLabel changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        labelInterval: function(val) {
            // console.log("vue - labelInterval changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showGrid: function(val) {
            // console.log("vue - showGrid changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        gridMinor: function(val) {
            // console.log("vue - gridMinor changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        gridMajor: function(val) {
            // console.log("vue - gridMajor changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        gridNice: function(val) {
            // console.log("vue - gridNice changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        yDirection: function(val) {
            // console.log("vue - yDirection changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'grid');
        },
        labelFontSize: function(val) {
            // console.log("vue - labelFontSize changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showScale: function(val) {
            // console.log("vue - showScale changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        /*
        incXDirection: function(val) {
            // console.log("vue - incXDirection changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        incYDirection: function(val) {
            // console.log("vue - incYDirection changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        */
        minX: function(val) {
            // console.log("vue - minX changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        maxX: function(val) {
            // console.log("vue - maxX changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        minY: function(val) {
            // console.log("vue - minY changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        maxY: function(val) {
            // console.log("vue - maxY changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        wells: {
            handler: function(val) {
                // console.log("vue - wells changed");
                updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'well');
            },
            deep: true
        },
        showWell: function(val) {
            // console.log("vue - showWells changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        trajectories: {
            handler: function(val) {
                // console.log("vue - trajectories changed");
                updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'well');
            },
            deep: true
        },
        showTrajectory: function(val) {
            // console.log("vue - showTrajectory changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showColorScaleLegend: function(val) {
            // console.log("vue - showColorScaleLegend changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'color');
        },
        colorLegendTicks: function(val) {
            // console.log("vue - colorLegendTicks changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'color');
        },
        contourUnit: function(val) {
            console.log("vue - contourUnit changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'color');
        },
        /*
        negativeData: function(val) {
            console.log("vue - negativeData changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn, 'all');
        }
        */
    },
    methods: {
        setCenter: function(xCoord, yCoord) {
            // console.log(`vue - setting center to (${xCoord}, ${yCoord})`);
            if (!_.isFinite(xCoord) || !_.isFinite(yCoord)) return;
            // neccessary transforms
            const canvasDOM = this.__contour.d3Canvas.node();
            const zoomBehavior = this.__contour.zoomBehavior;
            const nodeToPixelX = canvasDOM.__nodeToPixelX;
            const nodeToPixelY = canvasDOM.__nodeToPixelY;
            const nodeToCoord = canvasDOM.__gridToCoordinate;

            // if (!nodeToCoord) return;

            const nodeCoord = nodeToCoord.invert({x: xCoord, y: yCoord});
            const pixelX = nodeToPixelX(nodeCoord.x);
            const pixelY = nodeToPixelY(nodeCoord.y);
            const transformed = d3.zoomTransform(canvasDOM);

            const addX = (canvasDOM.width/2 - (pixelX * transformed.k  + transformed.x)) / transformed.k;
            const addY = (canvasDOM.height/2 - (pixelY * transformed.k + transformed.y)) / transformed.k;

            if (!_.isFinite(addX) || !_.isFinite(addY)) return;

            zoomBehavior.translateBy(this.__contour.d3Canvas, addX, addY);
        },
        setScale: function(scale) {
            this.__contour.zoomBehavior.scaleTo(this.__contour.d3Canvas, scale);
        },
        dataFn: function() {
            return {
                values: this.values,
                negativeData: this.negativeData,
                wells: this.wells,
                trajectories: this.trajectories,
                width: this.nRows,
                height: this.nCols,
                step: this.step,
                majorEvery: this.majorEvery,
                showLabel: this.showLabel,
                showGrid: this.showGrid,
                showColorScaleLegend: this.showColorScaleLegend,
                colorLegendTicks: this.colorLegendTicks,
                gridMajor: this.gridMajor,
                gridMinor: this.gridMinor,
                gridNice: this.gridNice,
                labelFontSize: this.labelFontSize,
                labelInterval: this.labelInterval,
                colorScale: this.colorScale,
                onScaleChanged: this.onScaleChanged,
                xInc: this.incXDirection || 50,
                yInc: this.incYDirection || 50,
                minX: this.minX,
                maxX: this.maxX,
                minY: this.minY,
                maxY: this.maxY,
                yDirection: this.yDirection,
                showScale: this.showScale,
                showWell: this.showWell,
                showTrajectory: this.showTrajectory,
                centerCoordinate: this.centerCoordinate,
                scale: this.scale,
                contourUnit: this.contourUnit,
            }
        }
    }
}
Vue.component(componentName, component);
export default component;

// FUNCTIONS DEFINITIONS
function initContour(container, dataFn) {
    const d3Container = d3.select(container);
    const containerWidth = d3Container.node().offsetWidth;
    const containerHeight = d3Container.node().offsetHeight;
    const d3Canvas = d3Container.append("canvas")
        // .style('background-color', 'black')
        .attr("width", containerWidth || 500)
        .attr("height", containerHeight || 500);

    const zoomBehavior = d3.zoom()
            .on("zoom", () => onCanvasZoom(d3Container, dataFn().onScaleChanged));
    d3Canvas.call(zoomBehavior);

    window.addEventListener("resize", _.debounce(() => updateCanvasOnResize(d3Container, d3Canvas), 200));
    return { d3Canvas, zoomBehavior };
}

function updateCanvasOnResize(d3Container, d3Canvas) {
    const containerWidth = d3Container.node().offsetWidth;
    const containerHeight = d3Container.node().offsetHeight;
    d3Canvas
        .attr("width", containerWidth || 500)
        .attr("height", containerHeight || 500);

    drawContour(d3Container);
}

function onCanvasZoom(d3Container, onScaleChanged) {
    const transform = _.clone(d3.event.transform);
    onScaleChanged && onScaleChanged(transform.k);
    updateCanvasTransformDebounced(d3Container, transform);
}

const updateCanvasTransformDebounced = _.throttle(updateCanvasTransform, 20);
function updateCanvasTransform(d3Container, transform) {
    requestAnimationFrame(() => {
        drawContour(d3Container, null, transform);
    })
}

const updateContourDataDebounced = _.debounce(updateContourData, 200);
function updateContourData(container, dataFn, forceDrawTarget=null) {
    const d3Container = d3.select(container);
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");
    const data = dataFn();

    // scale to pixel: 1 grid node ~ 1 pixel
    const gridToScreenX = d3.scaleLinear();
    const gridToScreenY = d3.scaleLinear();

    // projection scale: 1 grid cell ~ xy coordinate
    const gridToCoordinate = function(gridWidth, gridHeight, minX, maxX, minY, maxY, xInc = 50, yInc = 50, yDirection) {
        const scaleX = d3.scaleLinear()
            .domain([0, 1])
            .range([minX, minX + xInc]);
        const _yIsUp = yDirection == 'up';
        const _rangeScaleY = _yIsUp ? [maxY, maxY - yInc]:[minY, minY + yInc];
        const scaleY = d3.scaleLinear()
            .domain([0, 1])
            .range(_rangeScaleY);
        const invert = function(coordinate) {
            return {
                x: scaleX.invert(coordinate.x),
                y: scaleY.invert(coordinate.y),
            }
        }
        const forward = function(cell) {
            return {
                x: scaleX(cell.x),
                y: scaleY(cell.y),
            }
        }

        forward.invert = invert;
        return forward;
    }

    if (!data.width || !data.height) return;

    // prepare data for contour;
    const negativeData = data.negativeData;
    const contourValues = negativeData ? data.values.map(v => _.isFinite(v) ? Math.abs(v):null):data.values;
    const extent = d3.extent(contourValues);
    const step = data.step || (extent[1] - extent[0]) / 10; // default 10 contour;
    const threshold = d3.range(extent[0], extent[1], step);
    const contourData = d3.contours()
        .size([data.width, data.height])
        .thresholds(threshold)
        (contourValues);
    const gridToCoordinateTransform = gridToCoordinate(data.width, data.height, data.minX, data.maxX, data.minY, data.maxY, data.xInc, data.yInc, data.yDirection);
    Object.assign(contourData, {
        majorEvery: data.majorEvery,
        showLabel: data.showLabel,
        showScale: data.showScale,
        showTrajectory: data.showTrajectory,
        showWell: data.showWell,
        labelFontSize: data.labelFontSize,
        labelInterval: data.labelInterval,
        colorScale: data.colorScale,
        showColorScaleLegend: data.showColorScaleLegend,
        colorLegendTicks: data.colorLegendTicks,
        wells: data.wells,
        trajectories: data.trajectories,
        negativeData: data.negativeData,
        grid: {
            show: data.showGrid,
            nice: data.gridNice,
            width: data.width,
            height: data.height,
            nodeXToPixel: gridToScreenX,
            nodeYToPixel: gridToScreenY,
            nodeToCoordinate: gridToCoordinateTransform,
            majorTick: data.gridMajor,
            minorTick: data.gridMinor,
            minX: data.minX, maxX: data.maxX,
            minY: data.minY, maxY: data.maxY,
            yDirection: data.yDirection,
            xInc: data.xInc,
            yInc: data.yInc
        },
        values: data.values, // for draw color legend
        contourUnit: data.contourUnit,
    })

    // temporary save transform
    const canvasDOM = d3Canvas.node();
    canvasDOM.__nodeToPixelX = gridToScreenX;
    canvasDOM.__nodeToPixelY = gridToScreenY;
    canvasDOM.__gridToCoordinate = gridToCoordinateTransform;

    drawContour(d3Container, contourData, null, forceDrawTarget);
}

function getRoundNumber(number, base, flag='up') {
    if (base == 0) return number;
    const roundDown = Math.floor(number / base) * base;
    if (flag == 'down') return roundDown;
    const roundUp = roundDown + base;
    return roundUp;
}

function getGrid(contourData, transform) {
    // console.log("%c vue - recalculating grid", 'color: red');
    const minX = contourData.grid.minX;
    const maxX = contourData.grid.maxX;
    const minY = contourData.grid.minY;
    const maxY = contourData.grid.maxY;
    const major = contourData.grid.majorTick || 5;
    const minor = contourData.grid.minorTick || 5;;
    const pixelScale = transform ? transform.k : 1;

    const nodeCellToZoneCoordinate = contourData.grid.nodeToCoordinate;
    const nodeXToPixel = contourData.grid.nodeXToPixel;
    const nodeYToPixel = contourData.grid.nodeYToPixel;

    const genNiceTicks = contourData.grid.nice || false;;


    // calculate nice tick values
    const desiredColumns = major * minor;

    const desiredStepX = genNiceTicks
        ? Math.pow(10, Math.round(Math.log10((maxX - minX) / desiredColumns)) || 1)
        : (maxX - minX) / desiredColumns;
    const desiredStartX = genNiceTicks
        ? getRoundNumber(minX, desiredStepX, 'up')
        : minX;
    const desiredStopX = genNiceTicks
        ? getRoundNumber(maxX, desiredStepX, 'down')
        : maxX;

    const desiredStepY = genNiceTicks
        ? Math.pow(10, Math.round(Math.log10((maxY - minY) / desiredColumns)) || 1)
        : (maxY - minY) / desiredColumns;
    const desiredStartY = genNiceTicks
        ? getRoundNumber(minY, desiredStepY, 'up')
        : minY;
    const desiredStopY = genNiceTicks
        ? getRoundNumber(maxY, desiredStepY, 'down')
        : maxY;

    const colData = d3
        .range(desiredStartX, desiredStopX + desiredStepX, desiredStepX)
        .map((colCoordinate, idx) => {
            const nodeStartPoint = nodeCellToZoneCoordinate.invert({x: colCoordinate, y: maxY});
            const nodeEndPoint = nodeCellToZoneCoordinate.invert({x: colCoordinate, y: minY})
            const startPointPx = {
                x: nodeXToPixel(nodeStartPoint.x) * pixelScale,
                y: nodeYToPixel(nodeStartPoint.y) * pixelScale
            }
            const endPointPx = {
                x: nodeXToPixel(nodeEndPoint.x) * pixelScale,
                y: nodeYToPixel(nodeEndPoint.y) * pixelScale
            }
            const startIsLo = startPointPx.y < endPointPx.y;
            return {
                isMajor: idx % minor == 0,
                lo: startIsLo ? startPointPx:endPointPx,
                hi: startIsLo ? endPointPx:startPointPx,
                value: _.round(colCoordinate, 2)
            }
        })

    const rowData = d3
        .range(desiredStartY, desiredStopY + desiredStepY, desiredStepY)
        .map((rowCoordinate, idx) => {
            const nodeStartPoint = nodeCellToZoneCoordinate.invert({x: minX, y: rowCoordinate});
            const nodeEndPoint = nodeCellToZoneCoordinate.invert({x: maxX, y: rowCoordinate})
            const startPointPx = {
                x: nodeXToPixel(nodeStartPoint.x) * pixelScale,
                y: nodeYToPixel(nodeStartPoint.y) * pixelScale
            }
            const endPointPx = {
                x: nodeXToPixel(nodeEndPoint.x) * pixelScale,
                y: nodeYToPixel(nodeEndPoint.y) * pixelScale
            }
            const startIsLo = startPointPx.x < endPointPx.x;
            return {
                isMajor: idx % minor == 0,
                lo: startIsLo ? startPointPx:endPointPx,
                hi: startIsLo ? endPointPx:startPointPx,
                value: _.round(rowCoordinate, 2)
            }
        })

    return {rows:rowData, cols: colData};
}

function getPath2Ds(contourData, transform, xToPixel, yToPixel) {
    // console.log("%c vue - recalculating paths", 'color: red');
    const path2Ds = contourData
        .map(d => contourDataToPixelMap(d, transform, xToPixel, yToPixel))
        .map((contour, i) => {
            const path = d3.geoPath()(contour);
            return Object.assign(new Path2D(path), {
                pathData: _.clone(contour.coordinates),
            });
        });
    return path2Ds;
}

const SCALE_INDICATOR_MAX_WIDTH = 100; // 100px
function getScalePosition(contourData, transform, d3Canvas) {
    // console.log("%c vue - recalculating scale", 'color: red');
    const screenWidth = d3Canvas.node().width;
    const screenHeight = d3Canvas.node().height;
    const nodeXToPixel = contourData.grid.nodeXToPixel;
    const nodeYToPixel = contourData.grid.nodeYToPixel;
    const zoomedScale = transform ? transform.k : 1;
    const nodeCellToZoneCoordinate = contourData.grid.nodeToCoordinate;

    let step = Math.pow(10, Math.floor(Math.log10(zoomedScale % 10 || 0.01)));

    // get scale indicator for x dimension
    let cellUnit = step;
    while(nodeXToPixel(cellUnit) * zoomedScale < SCALE_INDICATOR_MAX_WIDTH)
        cellUnit += step;

    // 1m scale
    if (cellUnit == step && (nodeXToPixel(cellUnit) * zoomedScale > SCALE_INDICATOR_MAX_WIDTH)) {
        step = 0.01;
        cellUnit = step;
        while(nodeXToPixel(cellUnit) * zoomedScale < SCALE_INDICATOR_MAX_WIDTH)
            cellUnit += step;
    }

    // 1cm scale
    if (cellUnit == step && (nodeXToPixel(cellUnit) * zoomedScale > SCALE_INDICATOR_MAX_WIDTH)) {
        step = 0.0001;
        cellUnit = step;
        while(nodeXToPixel(cellUnit) * zoomedScale < SCALE_INDICATOR_MAX_WIDTH)
            cellUnit += step;
    }

    const rootCoordinateValue = nodeCellToZoneCoordinate({x: 0, y: 0});
    let cellUnitCoordinateValue = nodeCellToZoneCoordinate({x: cellUnit, y: cellUnit});

    let _unit = 'm';
    let _valueX = _.round(cellUnitCoordinateValue.x - rootCoordinateValue.x, Math.abs(Math.log(step)));

    if (step == 0.0001) {
        _unit = 'cm';
        _valueX = _.round(_valueX * 100, 1);
    }
    const startX = {
        x: (screenWidth) - 30 - nodeXToPixel(cellUnit) * zoomedScale,
        y: (screenHeight) - 30,
        value: `${_valueX} ${_unit}`,
    }
    const endX = {
        x: (screenWidth) - 30,
        y: (screenHeight) - 30,
        value: `${_valueX} ${_unit}`,
    }
    return { startX, endX };
}

const icon_well_path = 'M413.9,455.1h-9.6L319.2,37.7h1.9c7.1,0,12.9-5.8,12.9-12.9V14.7c0-7.1-5.8-12.9-12.9-12.9H170.9c-7.1,0-12.9,5.8-12.9,12.9  v10.1c0,7.1,5.8,12.9,12.9,12.9h0.9L86.8,455.1H76.6c-7.1,0-12.9,5.8-12.9,12.9v10.1c0,7.1,5.8,12.9,12.9,12.9h48.6  c7.1,0,12.9-5.8,12.9-12.9v-10.1c0-7.1-5.8-12.9-12.9-12.9h-1.8l20-98.3H228v98.3h-6.3c-7.1,0-12.9,5.8-12.9,12.9v10.1  c0,7.1,5.8,12.9,12.9,12.9h48.6c7.1,0,12.9-5.8,12.9-12.9v-10.1c0-7.1-5.8-12.9-12.9-12.9H264v-98.3h83.6l20,98.3h-2.3  c-7.1,0-12.9,5.8-12.9,12.9v10.1c0,7.1,5.8,12.9,12.9,12.9h48.6c7.1,0,12.9-5.8,12.9-12.9v-10.1C426.8,460.9,421,455.1,413.9,455.1z   M310.1,172.8H264V37.7h18.6L310.1,172.8z M228,37.7v135.2H181l27.6-135.2H228z M150.8,320.9l22.9-112.2H228v112.2H150.8z   M264,320.9V208.7h53.4l22.9,112.2H264z';
const icon_arrow_up_path = 'M442.627,185.388L265.083,7.844C260.019,2.78,253.263,0,245.915,0c-7.204,0-13.956,2.78-19.02,7.844L49.347,185.388    c-10.488,10.492-10.488,27.568,0,38.052l16.12,16.128c5.064,5.06,11.82,7.844,19.028,7.844c7.204,0,14.192-2.784,19.252-7.844    l103.808-103.584v329.084c0,14.832,11.616,26.932,26.448,26.932h22.8c14.832,0,27.624-12.1,27.624-26.932V134.816l104.396,104.752    c5.06,5.06,11.636,7.844,18.844,7.844s13.864-2.784,18.932-7.844l16.072-16.128C453.163,212.952,453.123,195.88,442.627,185.388z';
const icon_arrow_down_path = 'M49.4,306.6l177.5,177.5c5.1,5.1,11.8,7.8,19.2,7.8c7.2,0,14-2.8,19-7.8l177.5-177.5c10.5-10.5,10.5-27.6,0-38.1    l-16.1-16.1c-5.1-5.1-11.8-7.8-19-7.8c-7.2,0-14.2,2.8-19.3,7.8L284.4,356V26.9C284.4,12.1,272.8,0,258,0h-22.8    c-14.8,0-27.6,12.1-27.6,26.9v330.3L103.2,252.4c-5.1-5.1-11.6-7.8-18.8-7.8s-13.9,2.8-18.9,7.8l-16.1,16.1    C38.8,279,38.9,296.1,49.4,306.6z';
const icon_search_path = 'M 93.148438 80.832031 C 109.5 57.742188 104.03125 25.769531 80.941406 9.421875 C 57.851562 -6.925781 25.878906 -1.460938 9.53125 21.632812 C -6.816406 44.722656 -1.351562 76.691406 21.742188 93.039062 C 38.222656 104.707031 60.011719 105.605469 77.394531 95.339844 L 115.164062 132.882812 C 119.242188 137.175781 126.027344 137.347656 130.320312 133.269531 C 134.613281 129.195312 134.785156 122.410156 130.710938 118.117188 C 130.582031 117.980469 130.457031 117.855469 130.320312 117.726562 Z M 51.308594 84.332031 C 33.0625 84.335938 18.269531 69.554688 18.257812 51.308594 C 18.253906 33.0625 33.035156 18.269531 51.285156 18.261719 C 69.507812 18.253906 84.292969 33.011719 84.328125 51.234375 C 84.359375 69.484375 69.585938 84.300781 51.332031 84.332031 C 51.324219 84.332031 51.320312 84.332031 51.308594 84.332031 Z M 51.308594 84.332031';
const SUPPORTED_ICONS = {
    'well': {
        path: icon_well_path,
        scale: 0.05,
        offsetX: 0.05 * 270,
        offsetY: 0.05 * 530
    },
    'arrow_up': {
        path: icon_arrow_up_path,
        scale: 0.05,
        offsetX: 0.05 * 270,
        offsetY: 0.05 * 530
    },
    'arrow_down': {
        path: icon_arrow_down_path,
        scale: 0.05,
        offsetX: 0.05 * 270,
        offsetY: 0.05 * 530
    },
    'seach': {
        path: icon_search_path,
        scale: 0.05,
        offsetX: 0.05 * 270,
        offsetY: 0.05 * 530
    }
}

function getWellsPosition(contourData, transform) {
    // console.log("%c vue - recalculating wells", 'color: red');
    const wPos = [];
    const wells = contourData.wells || [];
    const nodeXToPixel = contourData.grid.nodeXToPixel;
    const nodeYToPixel = contourData.grid.nodeYToPixel;
    const zoomedScale = transform ? transform.k : 1;
    const nodeCellToZoneCoordinate = contourData.grid.nodeToCoordinate;

    wells.forEach(well => {
        const nodePos = nodeCellToZoneCoordinate.invert({x: well.xCoord, y: well.yCoord});
        wPos.push({
            x: nodeXToPixel(nodePos.x) * zoomedScale,
            y: nodeYToPixel(nodePos.y) * zoomedScale,
            well
        })
        if (well.popupConfig) {
            const popupCfg = well.popupConfig;
            const popupPos = nodeCellToZoneCoordinate.invert({x: popupCfg.xCoord, y: popupCfg.yCoord});
            wPos[wPos.length - 1].popupPos = {
                x: nodeXToPixel(popupPos.x) * zoomedScale,
                y: nodeYToPixel(popupPos.y) * zoomedScale,
            }
        }
    })

    return wPos;
}

function getTrajectoriesPosition(contourData, transform) {
    // console.log("%c vue - recalculating trajectories", 'color: red');
    const tPos = [];
    const trajectories = contourData.trajectories || [];
    const nodeXToPixel = contourData.grid.nodeXToPixel;
    const nodeYToPixel = contourData.grid.nodeYToPixel;
    const zoomedScale = transform ? transform.k : 1;
    const nodeCellToZoneCoordinate = contourData.grid.nodeToCoordinate;

    trajectories.forEach(trajectory => {
        const points = trajectory.points.map(p => {
            const nodePos = nodeCellToZoneCoordinate.invert({x: p.xCoord, y: p.yCoord});
            return {
                x: nodeXToPixel(nodePos.x) * zoomedScale,
                y: nodeYToPixel(nodePos.y) * zoomedScale,
            }
        });
        tPos.push({
            points,
            trajectory
        });

        if (trajectory.endPoint) {
            const endPoint = trajectory.endPoint;
            const nodePos = nodeCellToZoneCoordinate.invert({x: endPoint.xCoord, y: endPoint.yCoord});
            tPos[tPos.length - 1].endPoint = {
                x: nodeXToPixel(nodePos.x) * zoomedScale,
                y: nodeYToPixel(nodePos.y) * zoomedScale,
            }
        }

    })

    return tPos;
}

const DEFAULT_NUMBER_OF_TICKS = 50;
const DEFAULT_SCALE_BAR_LENGTH = 150;
const DEFAULT_LEGEND_DIRECTION = 'vertical';
const DEFAULT_CONTOUR_UNIT = 'm';
const DEFAULT_LEGEND_FONT_SIZE = 12;
function getColorLegendData (contourData, transform) {
    const legend = {};

    const legendDirection = DEFAULT_LEGEND_DIRECTION;
    const legendLength = DEFAULT_SCALE_BAR_LENGTH;
    const fontSize = DEFAULT_LEGEND_FONT_SIZE;
    // const negativeData = contourData.negativeData || false;
    const numberOfTicks = contourData.colorLegendTicks || DEFAULT_NUMBER_OF_TICKS;
    const colorScale = contourData.colorScale;
    const contourUnit = contourData.contourUnit || DEFAULT_CONTOUR_UNIT;
    const extent = d3.extent(colorScale.domain());
    const ticks = colorScale.ticks(numberOfTicks);
    const histogramGenerator = d3.histogram()
        .domain(extent)
        .thresholds(ticks);
    const bins = histogramGenerator(contourData.values);

    const numberOfMajorTicks = Math.ceil((legendLength + fontSize) / (fontSize + 5));
    const majorStepIdx = Math.ceil(ticks.length / numberOfMajorTicks);
    const majorTicks = [];
    let lastMajorTickIdx = null;
    for(const tIdx in ticks) {
        if(!lastMajorTickIdx) {
            lastMajorTickIdx = tIdx;
            majorTicks.push(ticks[tIdx]);
        } else if ((tIdx - lastMajorTickIdx) >= majorStepIdx) {
            lastMajorTickIdx = tIdx;
            majorTicks.push(ticks[tIdx]);
        }
    }

    legend.title = `Depth (${contourUnit})`;
    legend.ticks = ticks;
    legend.maxTick = d3.max(ticks);
    legend.minTick = d3.min(ticks);
    legend.majorTicks = majorTicks;
    legend.numberOfMajorTicks = numberOfMajorTicks;
    legend.histogramBins = bins.map(b => b.length);
    legend.histogramHeight = 100;
    legend.extent = extent;
    legend.colorScale = colorScale;
    legend.drawVertically = legendDirection == "vertical";
    legend.legendLength = legendLength;
    legend.fontSize = fontSize;

    return legend;
}

let cachedPath2Ds = [];
let cachedContourData = [];
let cachedWellsPosition = [];
let cachedTrajectoriesPosition = [];
let cachedTransform = null;
let cachedGrid = null;
let cachedAxes = null;
let cachedScalePosition = null;
let cachedColorLegendData = null;
function drawContour(d3Container, contourData, transform, force=null) {
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");

    const scaleChanged = (transform && cachedTransform && transform.k != cachedTransform.k)
        ? true:(cachedTransform ? false:true);

    cachedTransform = transform || cachedTransform;
    cachedContourData = contourData || cachedContourData;

    if (!cachedContourData.grid) return;

    const gridNodeXtoPixel = cachedContourData.grid.nodeXToPixel;
    const gridNodeYtoPixel = cachedContourData.grid.nodeYToPixel;
    cachedPath2Ds = (scaleChanged || force=="all" || force=="path")
        ? getPath2Ds(cachedContourData, cachedTransform, gridNodeXtoPixel, gridNodeYtoPixel)
        : cachedPath2Ds;
    cachedGrid = (scaleChanged || force=="all" || force=="grid")
        ? getGrid(cachedContourData, cachedTransform)
        : cachedGrid;

    cachedScalePosition = (scaleChanged || force=="all" || force=="scale")
        ? getScalePosition(cachedContourData, cachedTransform, d3Canvas)
        : cachedScalePosition;

    cachedWellsPosition = (scaleChanged || force=="all" || force=="well")
        ? getWellsPosition(cachedContourData, cachedTransform)
        : cachedWellsPosition;

    cachedTrajectoriesPosition = (scaleChanged || force=="all" || force=="well")
        ? getTrajectoriesPosition(cachedContourData, cachedTransform)
        : cachedTrajectoriesPosition;

    cachedColorLegendData = (force=="all" || force=="color")
        ? getColorLegendData(cachedContourData, cachedTransform)
        : cachedColorLegendData;

    // editing props
    cachedPath2Ds.showLabel = cachedContourData.showLabel;
    cachedPath2Ds.labelFontSize = cachedContourData.labelFontSize;
    cachedPath2Ds.labelInterval = cachedContourData.labelInterval;
    cachedPath2Ds.forEach((path, i) => {
        Object.assign(path, {
            fillColor: cachedContourData.negativeData
                ? cachedContourData.colorScale(-cachedContourData[i].value)
                : cachedContourData.colorScale(cachedContourData[i].value),
            isMajor: i % cachedContourData.majorEvery == 0,
            value: cachedContourData[i].value.toFixed(0),
        });
    })

    //draw grid
    if (cachedContourData.grid.show && cachedGrid) {
        requestAnimationFrame(() => {
            context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }
            context.lineWidth = 1;
            context.strokeStyle = 'grey';
            context.beginPath();
            // draw minor ticks
            cachedGrid.rows.filter(row => !row.isMajor).forEach(row => {
                context.moveTo(row.lo.x - 5, row.lo.y);
                context.lineTo(row.hi.x + 5, row.hi.y);
            })
            cachedGrid.cols.filter(col => !col.isMajor).forEach(col => {
                context.moveTo(col.lo.x, col.lo.y - 5);
                context.lineTo(col.hi.x, col.hi.y + 5);
            })
            context.closePath();
            context.stroke();
            // draw major ticks
            context.lineWidth = 2;
            context.strokeStyle = 'black';
            context.beginPath();
            cachedGrid.rows.filter(row => row.isMajor).forEach(row => {
                context.moveTo(row.lo.x - 10, row.lo.y);
                context.lineTo(row.hi.x + 10, row.hi.y);
            })
            cachedGrid.cols.filter(col => col.isMajor).forEach(col => {
                context.moveTo(col.lo.x, col.lo.y - 10);
                context.lineTo(col.hi.x, col.hi.y + 10);
            })
            context.closePath();
            context.stroke();
            context.restore();
        })
    } else {
        requestAnimationFrame(() => {
            context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
        })
    }

    // draw contour paths
    requestAnimationFrame(() => {
        context.save();
        if (cachedTransform) {
            context.translate(cachedTransform.x, cachedTransform.y);
        }
        context.lineWidth = 1;
        context.strokeStyle = "black";
        cachedPath2Ds.forEach(path => {
            if (path.isMajor)
                context.lineWidth = 3;
            context.stroke(path);
            if (path.isMajor)
                context.lineWidth = 1;
            context.fillStyle = path.fillColor;
            context.fill(path);

        })
        context.restore();
    })

    // draw grid text
    if (cachedContourData.grid.show && cachedGrid) {
        requestAnimationFrame(() => {
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }
            const translateY = cachedTransform ? cachedTransform.y : 0;
            const translateX = cachedTransform ? cachedTransform.x : 0;
            const TEXT_PADDING = 10;
            context.strokeStyle = 'black';
            context.fillStyle = 'black';
            context.font = `12px SansSerif`;
            context.textBaseline = 'middle';
            context.beginPath();
            cachedGrid.rows.filter(row => row.isMajor).forEach(row => {
                const textX = row.lo.x - 10 - TEXT_PADDING;
                const _textX = row.lo.x - translateX + TEXT_PADDING;
                if (_textX > textX) {
                    // background rect
                    context.fillStyle = 'white';
                    context.fillRect(_textX - 5, row.lo.y - 10, context.measureText(row.value).width + 10, 20);
                    context.strokeRect(_textX - 5, row.lo.y - 10, context.measureText(row.value).width + 10, 20);
                    context.fillStyle = 'black';

                    context.textAlign = 'start';
                    context.fillText(row.value, _textX, row.lo.y);
                } else {
                    context.textAlign = 'end';
                    context.fillText(row.value, textX, row.lo.y);
                }
            })
            context.textAlign = 'center';
            cachedGrid.cols.filter(cols => cols.isMajor).forEach(col => {
                const textY = col.lo.y - 10 - TEXT_PADDING;
                const _textY = col.lo.y - translateY + TEXT_PADDING;

                if (_textY > textY) {
                    // background rect
                    context.fillStyle = 'white';
                    const measuredWidth = context.measureText(col.value).width;
                    context.fillRect(col.lo.x - measuredWidth / 2 - 5, _textY - 10, measuredWidth + 10, 20);
                    context.strokeRect(col.lo.x - measuredWidth / 2 - 5, _textY - 10, measuredWidth + 10, 20);
                    context.fillStyle = 'black';

                    context.textBaseline = "Top";
                    context.fillText(col.value, col.lo.x, _textY);
                } else {
                    context.textBaseline = "Bottom";
                    context.fillText(col.value, col.lo.x, textY);
                }
            })
            context.restore();
        })
    }


    if (cachedPath2Ds.showLabel) {
        requestAnimationFrame(() => {
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }
            context.strokeStyle = "transparent";
            context.textAlign = "center";
            context.textBaseline = "Bottom";
            context.fillStyle =  "black";
            context.font = `${cachedPath2Ds.labelFontSize}px Sans-Serif`;
            context.lineWidth = 1;
            const labelInterval = cachedPath2Ds.labelInterval || 5000;
            const xInc = cachedContourData.grid.xInc || 50;
            const LABEL_STEP = Math.round(labelInterval / xInc); // in node
            cachedPath2Ds.forEach((path) => {
                if (path.isMajor) {
                    // draw value above path
                    path.pathData.forEach((ring) => {
                        const points = ring[0];
                        let i = 0;
                        while(i < points.length) {
                            const _points = points.slice(i, i + LABEL_STEP);
                            const _value = cachedContourData.negativeData ? -Math.abs(path.value) : path.value;
                            context.textPath(String(_value), _.flatten(_points));
                            i+=LABEL_STEP;
                        }
                    })
                }
            })
            context.restore();
        })
    }

    // draw scale indicator
    if (cachedContourData.showScale) {
        requestAnimationFrame(() => {
            // console.log("vue - scale indicator", cachedScalePosition);
            context.save();
            // if (cachedTransform) {
            //     context.translate(cachedTransform.x, cachedTransform.y);
            // }
            context.lineWidth = 2;
            context.strokeStyle = 'black';
            context.fillStyle = 'black';
            context.font = `12px Sans-Serif`;
            context.textAlign = 'end';

            context.beginPath()

            const startX = cachedScalePosition.startX;
            const endX = cachedScalePosition.endX;
            context.moveTo(startX.x, startX.y);
            context.lineTo(startX.x, startX.y + 10);
            context.lineTo(endX.x, endX.y + 10);
            context.lineTo(endX.x, endX.y);
            context.stroke();
            context.fillText(endX.value, endX.x - 5, endX.y);
            context.closePath();
            context.restore();
        })
    }
    if (cachedContourData.showTrajectory && cachedTrajectoriesPosition.length) {
        requestAnimationFrame(() => {
            // console.log("vue - trajectory indicator", cachedScalePosition);
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }

            const trajectories = cachedTrajectoriesPosition || [];
            trajectories.forEach(t => {
                if (!t.points.length || t.points.length == 1) return;
                context.strokeStyle = t.trajectory.color || 'black';
                context.lineWidth = t.trajectory.lineWidth || 1;
                context.beginPath();
                t.points.forEach((tp, tpIdx) => {
                    if(tpIdx == 0)
                        context.moveTo(tp.x, tp.y);
                    else
                        context.lineTo(tp.x, tp.y);
                })
                context.stroke();

                if (t.endPoint) {
                    context.fillStyle = t.trajectory.endPoint.color || 'black';
                    const radius = t.trajectory.endPoint.radius || 2;
                    const centerX = t.endPoint.x;
                    const centerY = t.endPoint.y;
                    context.beginPath();
                    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                    context.fill();
                }
            })

            context.restore();
        })
    }

    if (cachedContourData.showWell && cachedWellsPosition.length) {
        requestAnimationFrame(() => {
            // console.log("vue - well indicator", cachedScalePosition);
            context.save();
            if (cachedTransform) {
                context.translate(cachedTransform.x, cachedTransform.y);
            }
            const SYMBOL_SIZE = 5;
            const FONT_SIZE = 12;

            context.textAlign = 'center';
            context.font = `${FONT_SIZE}px Sans-Serif`;
            cachedWellsPosition.forEach(wellPos => {
                const icon = SUPPORTED_ICONS[wellPos.well.icon || 'well'];
                context.fillStyle = wellPos.well.color || 'black';
                context.save();
                context.translate(wellPos.x - icon.offsetX,  wellPos.y - icon.offsetY);
                context.scale(icon.scale, icon.scale);
                const path = new Path2D(icon.path);
                context.fill(path);
                context.closePath();
                context.restore();

                // draw popup
                let popupPos = wellPos.popupPos || wellPos;
                if (popupPos == wellPos) {
                    popupPos = _.clone(wellPos);
                    popupPos.y -= icon.offsetY;
                }
                const drawContent = _.get(wellPos, 'well.displayContent', wellPos.well.name);
                const textWidth = context.measureText(drawContent).width;
                context.strokeStyle = "black";
                context.fillStyle = 'white';
                context.strokeRect(popupPos.x - textWidth / 2 - 5, popupPos.y - 15 - FONT_SIZE, textWidth + 10, FONT_SIZE + 5);
                context.fillRect(popupPos.x - textWidth / 2 - 5, popupPos.y - 15 - FONT_SIZE, textWidth + 10, FONT_SIZE + 5);

                context.beginPath();
                context.moveTo(popupPos.x - 5, popupPos.y - 11);
                context.lineTo(popupPos.x, popupPos.y);
                context.lineTo(popupPos.x + 5, popupPos.y - 11);
                context.stroke();
                context.fill();
                context.fillStyle = 'black';
                context.fillText(drawContent, popupPos.x, popupPos.y - 15);
                context.closePath();
            })
            context.restore();
        })
    }


    if (cachedContourData.showColorScaleLegend && cachedColorLegendData) {
        requestAnimationFrame(() => {
            context.save();

            if (cachedColorLegendData.drawVertically) {
                // vertically draw
                context.translate(10, 20);
                context.strokeStyle = 'black';
                context.fillStyle = 'black';
                context.font = `${cachedColorLegendData.fontSize}px Sans-Serif`;
                context.textAlign = 'start';
                context.fillText(cachedColorLegendData.title, 0, 0);
                context.translate(0, 10);
                const length = cachedColorLegendData.legendLength;

                // draw color scale bar
                const colorScale = cachedColorLegendData.colorScale;
                const colorBarWidth = 20;
                // draw from bottom -> top
                const grad = context.createLinearGradient(0, length, 0, 0);
                const normalizeDomain = d3.scaleLinear()
                        .domain(cachedColorLegendData.extent)
                        .range([0, 1]);
                colorScale.domain().forEach(p => {
                    grad.addColorStop(normalizeDomain(p), colorScale(p));
                });
                context.fillStyle = grad;
                context.fillRect(0, 0, colorBarWidth, length);
                // draw ticks
                context.translate(colorBarWidth, 0);
                const scaleY = d3.scaleLinear()
                    .domain(cachedColorLegendData.extent)
                    .range([length, 0]);
                context.lineWidth = 1;
                context.textBaseline = 'middle';
                context.fillStyle = 'black';
                context.beginPath();
                cachedColorLegendData.majorTicks.forEach(tick => {
                    const tickY = scaleY(tick);
                    context.moveTo(0, tickY);
                    context.lineTo(10, tickY);
                    context.fillText(tick, 12, tickY);
                })
                context.stroke();

                // draw histogram
                const ticks = cachedColorLegendData.ticks;
                const maxTickWidth = context.measureText(cachedColorLegendData.maxTick).width;
                const minTickWidth = context.measureText(cachedColorLegendData.minTick).width;
                const startHisPoint = Math.max(maxTickWidth, minTickWidth) + 20;
                context.translate(startHisPoint, 0);
                const bins = cachedColorLegendData.histogramBins;
                const binWidth = length / bins.length;
                const binHeightScale = d3.scaleLinear()
                    .domain(d3.extent(bins))
                    .range([0, cachedColorLegendData.histogramHeight]);
                context.fillStyle = grad;
                for(const tIdx in ticks) {
                    context.fillRect(0, scaleY(ticks[tIdx]), binHeightScale(bins[tIdx]), binWidth);
                }
                context.closePath();
            } else {
                // LATER: horizontally draw
            }

            context.restore();
        })
    }

    // draw north sign
    /* USING LATER WHEN SUPPORT FOR MAP ROTATION
    requestAnimationFrame(() => {
        context.save();
        const canvasDOM = d3Canvas.node();
        const cWidth = canvasDOM.width;
        const cHeight = canvasDOM.height;

        context.fillStyle = "green";
        context.strokeStyle = "green";

        // arrow body
        context.translate(cWidth-50, 50);
        context.fillRect(-5, -20, 10, 40);
        // arrow vertex
        if (cachedContourData && cachedContourData.grid && cachedContourData.grid.yDirection != 'up')
            context.rotate(Math.PI);
        context.translate(0, -20);
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-10, 5);
        context.lineTo(0, -20);
        context.lineTo(10, 5);
        context.closePath();
        context.fill();
        context.translate(0, 20);
        if (cachedContourData && cachedContourData.grid && cachedContourData.grid.yDirection != 'up')
            context.rotate(Math.PI);
        // draw text
        context.strokeStyle = "white";
        context.fillStyle = "black";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 20px Sans-serif";
        context.strokeText("North", 0, 0);
        context.fillText("North", 0, 0);

        context.restore();
    })
    */
}

function contourDataToPixelMap({type, value, coordinates}, transform, xToPixel, yToPixel) {
    const _transform = transform || {x: 0, y: 0, k: 1};
    return {type, value, coordinates: coordinates.map(rings => {
        return rings.map(points => {
            return points.map(([x, y]) => {
                return [
                    xToPixel(x) * _transform.k /*+ _transform.x*/,
                    yToPixel(y) * _transform.k /*+ _transform.y*/,
                ];
            })
        })
    })}
}
