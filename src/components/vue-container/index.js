import angular from 'angular';
import Vue from 'vue/dist/vue.min.js';
import {Plugin} from 'vue-fragment';
const moduleName = "vueContainer";
export default moduleName;

Vue.use(Plugin);

angular.module(moduleName,[]).component(moduleName, {
    template: '',
    controller: Controller,
    bindings: {
        vueData: "<",
        vueMethods: "<"
    }, 
    transclude: true
});

function Controller($transclude, $element) {
    let self = this;
    this.$onInit = function() {
        $transclude((transcludedContent) => {
            let vueElem; 
            for (let i =0; i < transcludedContent.length; i++) {
                if (transcludedContent[i].nodeType === 1) {
                    vueElem = transcludedContent[i]; break;
                }
            }
            new Vue({
                el: $element[0],
                template: vueElem.outerHTML,
                data: self.vueData || {},
                methods: self.vueMethods || {}
            });
        })
    }
}
