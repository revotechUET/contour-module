import Vue from "vue/dist/vue.min.js";
import template from "./template.html";
import { parseZmapGrid, toZmapFile } from "./parser";
const componentName = "contour-file-import";
const component = {
    props: {
        'onDataChanged': Function,
        'negativeData': Boolean,
        'onComponentMounted': Function
    },
    data: () => ({
        headers: {},
        data: [],
    }),
    template,
    mounted() {
        this.$nextTick(() => {
            if (typeof(this.onComponentMounted) == 'function')
                this.onComponentMounted(this);
        })
    },
    methods: {
        doParseFromContent: function(content) {
            const parsedData = parseZmapGrid(content);
            this.exposeData(parsedData.headers, parsedData.data);
        },
        onFileChange: function(event) {
            if (!event.target.files[0]) return;
            const reader = new FileReader();
            reader.onload = e => {
                this.doParseFromContent(e.target.result);
                /*
                const parsedData = parseZmapGrid(e.target.result);
                this.exposeData(parsedData.headers, parsedData.data);
                */
            }
            reader.readAsText(event.target.files[0]);
        },
        exposeData: function(headers, data) {
            this.headers = headers;
            this.data = data;
            const _data = JSON.parse(JSON.stringify(data))
            if (this.negativeData) {
                let i = 0;
                let j = 0;
                for (i=0; i<_data.length; ++i) {
                    for(j=0; j<_data[i].length; ++j) {
                        if (_data[i][j] && _data[i][j] > 0)
                            _data[i][j] = - _data[i][j];
                    }
                }
            }
            this.onDataChanged({
                headers: this.headers,
                data: _data
            });
        },
        toZmapFile: function() {
            return toZmapFile(this.headers, this.data);
        }
    },
    watch: {
        negativeData: function(val) {
            console.log('vue - negativeData changed to ', val);
            this.exposeData(this.headers, this.data);
        }
    }
}

Vue.component(componentName, component);
export default component;
