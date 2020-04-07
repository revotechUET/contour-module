import Vue from "vue/dist/vue.min.js";
import "!style-loader!css-loader!./style.css";
import * as d3 from "d3";
import template from "./template.html";
const componentName = "color-scale-generator";

const component = {
    props: ['onScaleChanged', 'minVal', 'maxVal'],
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
            const d3Canvas = d3Container.append('canvas')
                    .attr('width', d3Container.node().offsetWidth)
                    .attr('height', 50);
            // sample palette
            this.domain = [this.minVal, this.maxVal];
            this.range = ['red', 'blue'];
            const scale = d3.scaleLinear().domain(this.domain).range(this.range);
            this.colorBar = new ColorBar(d3Canvas);
            this.colorBar.scale = scale;
            this.colorBar.redraw();
        })
    },
    methods: { },
    watch: {
        minVal: function(newVal) {
        },
        domain: (val) => {
            console.log("domain changed", val);
        },
        range: (val) => {
            console.log("range changed", val);
        }
    }
}
Vue.component(componentName, component);
export default component;

function ColorBar(d3Canvas) {
    this.d3Canvas = d3Canvas;
    this.canvasNode = d3Canvas.node();
    this.context = this.canvasNode.getContext('2d');
    this.scale = null;

    this.redraw = () => {
        if(!this.scale) return;
        const domain = this.scale.domain();
        const extent = d3.extent(domain);
        const normalizeFn = d3.scaleLinear().domain(extent).range([0, 1]);
        const transformX = d3.scaleLinear().domain(extent).range([0, this.canvasNode.width]);
        const grd = this.context.createLinearGradient(0, 0, this.canvasNode.width, 0);
        domain.forEach(point => {
            grd.addColorStop(normalizeFn(point), this.scale(point));
        })
        // draw
        this.context.clearRect(0, 0, this.canvasNode.width, this.canvasNode.height);
        this.context.fillStyle = grd;
        this.context.fillRect(0, 0, this.canvasNode.width, this.canvasNode.height);

        // draw color stop;
        this.context.fillStyle = 'black';
        domain.forEach(point => {
            this.context.fillRect(
                transformX(point) - 2, 0,
                4, this.canvasNode.height + 10
            )
        })
    }
}
