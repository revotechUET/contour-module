import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import template from "./template.html";
const componentName = "color-scale-generator";

const component = {
    // props: ['onScaleChanged', 'minVal', 'maxVal'],
    props: {
        'onScaleChanged': Function,
        'minVal': Number,
        'maxVal': Number
    },
    data: function() {
        return {
            domain: [],
            range: [],
            colorBar: null,
        }
    },
    template,
    mounted() {
        this.$nextTick(() => {
            const d3Container = d3.select(this.$refs.colorBar);
            // create handles for color stops
            const d3Svg = d3Container.append("svg")
                    .style('position', 'absolute')
                    .style('overflow', 'visible')
                    .style('width', d3Container.node().offsetWidth)
                    .style('height', 90);
            // draw color gradient
            const d3Canvas = d3Container.append('canvas')
                    .attr('width', d3Container.node().offsetWidth)
                    .attr('height', 50);

            // sample palette
            this.domain = [this.minVal, this.maxVal];
            this.range = ['red', 'blue'];
            this.colorBar = new ColorBar(d3Canvas);
            this.colorBar.redraw(this.domain, this.range);

            this.colorHandles = new ColorHandles(d3Svg, this.onColorStopsChanged);
            this.colorHandles.updateColorStops(this.domain, this.range);

        })
    },
    methods: {
        onColorStopsChanged: function(domain, range) {
            this.domain = domain;
            this.range = range;
            this.colorBar.redraw(this.domain, this.range);
            // update scale
            this.onScaleChanged(d3.scaleLinear().domain(this.domain).range(this.range));
        },
        updateVertices: function(_minVertex, _maxVertex) {
            const minVertex = _.isFinite(_minVertex) ? _minVertex : 0;
            const maxVertex = _.isFinite(_maxVertex) ? _maxVertex : minVertex + 1;

            const extent = d3.extent(this.domain);
            if (extent[0] == minVertex && extent[1] == maxVertex) return;
            const scaleFn = d3.scaleLinear()
                    .domain(extent)
                    .range([minVertex, maxVertex]);
            for(const idx in this.domain) {
                this.domain[idx] = scaleFn(this.domain[idx]);
            }
            this.colorBar.redraw(this.domain, this.range);
            this.colorHandles.updateColorStops(this.domain, this.range);

            // reupdate scale for external
            this.onScaleChanged(d3.scaleLinear().domain(this.domain).range(this.range));
        }
    },
    watch: {
        minVal: function(val) {
            console.log("vue - colorGenerator: minVal changed");
            this.updateVertices(this.minVal, this.maxVal);
        },
        maxVal: function(val) {
            console.log("vue - colorGenerator: maxVal changed");
            this.updateVertices(this.minVal, this.maxVal);
        },
    }
}
Vue.component(componentName, component);
export default component;

function ColorHandles(d3Svg, onColorStopChanges) {
    const handler = this;
    this.d3Svg = d3Svg;
    this.colorStops = [];
    this.transformX = d3.scaleLinear().range([0, d3Svg.node().clientWidth]);

    this.updateColorStops = function(domain, range) {
        removeAllColorStops();
        this.transformX
            .domain(d3.extent(domain))
            .range([0, d3Svg.node().clientWidth]);
        for(const index in domain) {
            addColorStop(domain[index], range[index], function(value, color) {
                domain[index] = value;
                range[index] = color;
                const sorted = sortPair(domain, range);
                onColorStopChanges(sorted.domain, sorted.range);
            }, function() {
                // on delete
                if (index == 0 || index == domain.length - 1) return;
                domain.splice(index, 1);
                range.splice(index, 1);
                const sorted = sortPair(domain, range);
                handler.updateColorStops(sorted.domain, sorted.range);
                onColorStopChanges(sorted.domain, sorted.range);
            } , (index == 0 || index == domain.length - 1), index);
        }
    }

    this.d3Svg.on('click', function() {
        console.log('bar click',d3.event);
        const newValue = handler.transformX.invert(d3.event.x);
        const newColor = 'red';
        const domain = handler.colorStops.map(colorStop => colorStop.__value);
        const range = handler.colorStops.map(colorStop => colorStop.__color);
        domain.push(newValue);
        range.push(newColor);
        const sorted = sortPair(domain, range);
        handler.updateColorStops(sorted.domain, sorted.range);
        onColorStopChanges(sorted.domain, sorted.range);
    })

    const removeColorStop = function(colorStop) {
        colorStop.remove();
    }

    const removeAllColorStops = () => {
        this.colorStops.forEach(removeColorStop)
        this.colorStops.length = 0;
    }

    const HANDLE_WIDTH = 4;
    const addColorStop = (value, color, onChanged, deleteFn, disableDrag, pIdx) => {
        const xPosition = this.transformX(value);
        const colorStopGroup = d3Svg.append('g')
            .attr('transform', `translate(${xPosition}, 0)`)
            .attr('x', 0)
            .attr('y', 0);
        const rect = colorStopGroup.append('rect')
            .attr('width', HANDLE_WIDTH)
            .attr('height', 50)
            .attr('x', - HANDLE_WIDTH/2)
            .attr('y', 0)
            .style('cursor', disableDrag ? 'auto':'col-resize')
            .style('fill', 'black');

        colorStopGroup.__value = value;
        colorStopGroup.__color = color;

        rect.on('mouseover', function() {
            rect.attr('width', HANDLE_WIDTH*2)
                .attr('x', -HANDLE_WIDTH);
        })
        rect.on('mouseleave', function() {
            rect.attr('width', HANDLE_WIDTH)
                .attr('x', -HANDLE_WIDTH/2);
        })

        const colorIndicator = colorStopGroup.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('x', -5)
            .attr('y', 55)
            .style('cursor', 'pointer')
            .style('fill', color);

        const textIndicator = colorStopGroup.append('text')
            .attr('x', 0)
            .attr('y', 80)
            .attr('text-anchor', disableDrag ? (pIdx == 0 ? 'start':'end'):'middle')
            .style('font-size', 12)
            .text(value.toFixed(3));

        rect.on('click', function() {
            d3.event.stopPropagation();
            if(d3.event.ctrlKey) {
                deleteFn();
            };
        })

        colorIndicator.on('click', function() {
            d3.event.stopPropagation();
            if(d3.event.ctrlKey) {
                deleteFn();
                return;
            };
            openColorPicker(d3.select(this).style('fill'))
                .then(color => {
                    d3.select(this).style('fill', color);
                    colorStopGroup.__color = color;
                    onChanged(colorStopGroup.__value, colorStopGroup.__color);
                })
        })

        // enable dragging
        if (!disableDrag)
            colorStopGroup.call(d3.drag()
                .on('start', () => onStartDragging(colorStopGroup, onChanged))
                .on('drag', () => onDragging(colorStopGroup, onChanged))
                .on('end', () => onStopDragging(colorStopGroup, onChanged))
            );

        this.colorStops.push(colorStopGroup);
    }

    function onStartDragging(colorStopGroup, onChanged) {
        if (!isInside(d3.event.x, handler.transformX.range())) return;
        colorStopGroup.__value = handler.transformX.invert(d3.event.x);
        colorStopGroup
            .attr("transform", `translate(${d3.event.x}, 0)`);
        colorStopGroup.select('text')
            .text(colorStopGroup.__value.toFixed(3));
        onChanged(colorStopGroup.__value, colorStopGroup.__color);

        const tooltipGroup = colorStopGroup.append('g')
            .attr('class', 'text-tool-tip')
            .attr('x', 0)
            .attr('y', 0);
        tooltipGroup.append('text')
            .attr('font-size', 12)
            .attr('x', 0)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .text(colorStopGroup.__value.toFixed(4));
    }

    function onStopDragging(colorStopGroup, onChanged) {
        if (!isInside(d3.event.x, handler.transformX.range())) return;
        colorStopGroup.__value = handler.transformX.invert(d3.event.x);
        colorStopGroup
            .attr("transform", `translate(${d3.event.x}, 0)`);
        colorStopGroup.select('text')
            .text(colorStopGroup.__value.toFixed(3));
        onChanged(colorStopGroup.__value, colorStopGroup.__color);

        colorStopGroup.select('g.text-tool-tip').remove();
    }

    function onDragging(colorStopGroup, onChanged) {
        if (!isInside(d3.event.x, handler.transformX.range())) return;
        colorStopGroup.__value = handler.transformX.invert(d3.event.x);
        colorStopGroup
            .attr("transform", `translate(${d3.event.x}, 0)`);
        colorStopGroup.select('text')
            .text(colorStopGroup.__value.toFixed(3));
        onChanged(colorStopGroup.__value, colorStopGroup.__color);

        colorStopGroup
            .select('g.text-tool-tip > text')
            .text(colorStopGroup.__value.toFixed(4));
    }
}

function isInside(value, range) {
    return (value - range[0])*(value - range[1]) <= 0;
}

function sortPair(domain, color) {
    const pairs = [];
    for (const idx in domain) {
        pairs.push([domain[idx], color[idx]]);
    }
    pairs.sort((pa, pb) => pa[0] - pb[0]);
    return {
        domain: pairs.map(p => p[0]),
        range: pairs.map(p => p[1])
    }
}

function openColorPicker(color) {
    return new Promise(resolve => {
        const inputColor = document.createElement('input');
        inputColor.type = 'color';
        inputColor.value = color;
        inputColor.addEventListener('change', () => {
            const col = inputColor.value;
            inputColor.remove();
            resolve(col);
        })
        inputColor.click();
    })
}

function ColorBar(d3Canvas) {
    this.d3Canvas = d3Canvas;
    this.canvasNode = d3Canvas.node();
    this.context = this.canvasNode.getContext('2d');
    this.domain = [];
    this.range = [];

    // redraw color gradient
    this.redraw = (domain, range) => {
        this.domain = domain || this.domain;
        this.range = range || this.range;
        if(!this.domain.length || !this.range.length) return;

        const scale = d3.scaleLinear().domain(this.domain).range(this.range);
        const extent = d3.extent(this.domain);
        const normalizeFn = d3.scaleLinear().domain(extent).range([0, 1]);
        const transformX = d3.scaleLinear().domain(extent).range([0, this.canvasNode.width]);
        const grd = this.context.createLinearGradient(0, 0, this.canvasNode.width, 0);
        this.domain.forEach(point => {
            grd.addColorStop(normalizeFn(point), scale(point));
        })
        // draw
        this.context.clearRect(0, 0, this.canvasNode.width, this.canvasNode.height);
        this.context.fillStyle = grd;
        this.context.fillRect(0, 0, this.canvasNode.width, this.canvasNode.height);
    }
}
