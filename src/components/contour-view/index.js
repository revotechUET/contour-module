import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import template from "./template.html";
const componentName = "contour-view";

const component = {
    props: [
        'values', "nRows", "nCols", "colorScale", "step", "majorTick", "labelFontSize", "showLabel",
        'onScaleChanged'
    ],
    template,
    mounted() {
        this.$nextTick(() => {
            initContour(this.$refs.drawContainer, this.dataFn);
        })
    },
    watch: {
        values: function(val) {
            console.log("watching values");
            updateContourData(this.$refs.drawContainer, this.dataFn);
        },
        colorScale: function() {
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        step: function(val) {
            console.log("onStep changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        majorTick: function(val) {
            console.log("majorTick changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        showLabel: function(val) {
            console.log("showLabel changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        },
        labelFontSize: function(val) {
            console.log("labelFontSize changed");
            updateContourDataDebounced(this.$refs.drawContainer, this.dataFn);
        }
    },
    methods: {
        dataFn: function() {
            return {
                values: this.values,
                width: this.nRows,
                height: this.nCols,
                step: this.step,
                majorTick: this.majorTick,
                showLabel: this.showLabel,
                labelFontSize: this.labelFontSize,
                colorScale: this.colorScale,
                onScaleChanged: this.onScaleChanged
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
        .attr("width", containerWidth || 500)
        .attr("height", containerHeight || 500);

    const zoomBehavior = d3.zoom()
            .on("zoom", () => onCanvasZoom(d3Container, dataFn().onScaleChanged));
    d3Canvas.call(zoomBehavior);

    window.addEventListener("resize", (e) => {
        // update canvas size
        const containerWidth = d3Container.node().offsetWidth;
        const containerHeight = d3Container.node().offsetHeight;
        d3Canvas
            .attr("width", containerWidth || 500)
            .attr("height", containerHeight || 500);

        drawContourSync(d3Container);
    });
}

function onCanvasZoom(d3Container, onScaleChanged) {
    const transform = _.clone(d3.event.transform);
    onScaleChanged && onScaleChanged(transform.k);
    updateCanvasTransformDebounced(d3Container, transform);
}

const updateCanvasTransformDebounced = _.throttle(updateCanvasTransform, 20);
function updateCanvasTransform(d3Container, transform) {
    requestAnimationFrame(() => {
        drawContourSync(d3Container, null, transform);
    })
}

const updateContourDataDebounced = _.debounce(updateContourData, 200);
function updateContourData(container, dataFn) {
    const d3Container = d3.select(container);
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");
    const data = dataFn();

    if (!data.width || !data.height) return;

    const extent = d3.extent(data.values);
    const threshold = d3.range(extent[0], extent[1], data.step);

    // prepare data for contour;
    const contourData = d3.contours()
        .size([data.width, data.height])
        .thresholds(threshold)
        (data.values);
    /*
    const mappedContourData = contourData.map(contourDataToPixelMap);

    const path2Ds = mappedContourData.map((contour, i) => {
        const path = d3.geoPath()(contour);
        return Object.assign(new Path2D(path),
                {
                    fillColor: data.colorScale(contour.value),
                    isMajor: i % data.majorTick == 0,
                    pathData: _.clone(contour.coordinates),
                    value: contour.value.toFixed(0),
                });
    })
    path2Ds.showLabel = data.showLabel;
    path2Ds.labelFontSize = data.labelFontSize;
    */
    Object.assign(contourData, {
        majorTick: data.majorTick,
        showLabel: data.showLabel,
        labelFontSize: data.labelFontSize,
        colorScale: data.colorScale
    })

    drawContourSync(d3Container, contourData);
}

function getPath2Ds(contourData, transform) {
    console.log("recalculating paths");
    const path2Ds = contourData
        .map(d => contourDataToPixelMap(d, transform))
        .map((contour, i) => {
            const path = d3.geoPath()(contour);
            return Object.assign(new Path2D(path), {
                pathData: _.clone(contour.coordinates),
            });
        });
    return path2Ds;
}

let cachedPath2Ds = [];
let cachedContourData = [];
let cachedTransform = null;
function drawContourSync(d3Container, contourData, transform) {
    const d3Canvas = d3Container.select('canvas');
    const context = d3Canvas.node().getContext("2d");

    const scaleChanged = (transform && cachedTransform && transform.k != cachedTransform.k) ? true:(cachedTransform ? false:true);

    cachedTransform = transform || cachedTransform;
    cachedContourData = contourData || cachedContourData;
    cachedPath2Ds = scaleChanged ? getPath2Ds(cachedContourData, cachedTransform) : cachedPath2Ds;

    // editing props
    cachedPath2Ds.showLabel = cachedContourData.showLabel;
    cachedPath2Ds.labelFontSize = cachedContourData.labelFontSize;
    cachedPath2Ds.forEach((path, i) => {
        Object.assign(path, {
            fillColor: cachedContourData.colorScale(cachedContourData[i].value),
            isMajor: i % cachedContourData.majorTick == 0,
            value: cachedContourData[i].value.toFixed(0),
        });
    })

    context.save();
    context.clearRect(0, 0, d3Canvas.attr("width"), d3Canvas.attr("height"));
    if (cachedTransform) {
        context.translate(cachedTransform.x, cachedTransform.y);
        // context.scale(cachedTransform.k, cachedTransform.k);
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

    if (cachedPath2Ds.showLabel) {
        context.strokeStyle = "black";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle =  "white";
        context.font = `${cachedPath2Ds.labelFontSize}px Sans-Serif`;
        context.lineWidth = 1;
        const LABEL_STEP = 30;
        cachedPath2Ds.forEach((path) => {
            if (path.isMajor) {
                // draw value above path
                path.pathData.forEach((ring) => {
                    const points = ring[0];
                    let i = 0;
                    while(i < points.length) {
                        const _points = points.slice(i, i + LABEL_STEP);
                        context.textPath(path.value, _.flatten(_points));
                        i+=LABEL_STEP;
                    }
                })
            }
        })
    }
    context.restore();
}

function contourDataToPixelMap({type, value, coordinates}, transform) {
    const _transform = transform || {x: 0, y: 0, k: 1};
    return {type, value, coordinates: coordinates.map(rings => {
        return rings.map(points => {
            return points.map(([x, y]) => {
                return [
                    (x) * _transform.k /*+ _transform.x*/,
                    (y) * _transform.k /*+ _transform.y*/,
                ];
            })
        })
    })}
}
