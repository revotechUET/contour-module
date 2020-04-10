import angular from 'angular';
import vueContainer from './vue-container';

const makeAngularModule = function(moduleName, template, propList) {
    const bindings = {};
    propList.forEach(propKey => bindings[propKey + 'Get'] = '<');

    angular
        .module(moduleName, [vueContainer])
        .component(moduleName, {
            template: `
                <vue-container vue-data='ngVue.vueData' vue-methods='ngVue.vueMethods'>
                    ${template}
                </vue-container>
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
                this.vueData[propKey] = this[propKey + 'Get']();
                $scope.$watch(this[propKey + 'Get'], () => {
                    // console.log(`${propKey} has watched changes`)
                    this.vueData[propKey] = this[propKey + 'Get']();
                })
            })
        }
    }
}

export default makeAngularModule;
