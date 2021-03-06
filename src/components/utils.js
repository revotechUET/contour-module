import angular from 'angular';
import vueContainer from './vue-container';

const makeAngularModule = function(moduleName, template, propList) {
    const bindings = {};
    propList.forEach(propKey => bindings[propKey + 'Get'] = '<');

    angular
        .module(moduleName, [vueContainer])
        .component(moduleName, {
            template: `
                <container-vue vue-data='ngVue.vueData' vue-methods='ngVue.vueMethods'>
                    ${template}
                </container-vue>
            `,
            controller: ['$scope', Controller],
            controllerAs: 'ngVue',
            bindings
        })
    function Controller($scope) {
        this.vueData = {};
        this.vueMethods = {};
        this.$onInit = function() {
            propList.forEach(propKey => {
                if (typeof(this[propKey + 'Get']) == 'function') {
                    this.vueData[propKey] = this[propKey + 'Get']();
                    $scope.$watch(this[propKey + 'Get'], () => {
                        // console.log(`${propKey} has watched changes`)
                        this.vueData[propKey] = this[propKey + 'Get']();
                    })
                } else {
                    this.vueData[propKey] = null;
                }
            })
        }
    }
}

export default makeAngularModule;
