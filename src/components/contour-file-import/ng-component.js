import angular from 'angular';
import vueContainer from '../vue-container';
import vueComponent from "./index";
import makeAngularModule from '../utils';

const moduleName = 'contourFileImport';
export default moduleName;

const propList = Array.isArray(vueComponent.props) ? vueComponent.props : Object.keys(vueComponent.props);
const template = `
    <contour-file-import
        ng-non-bindable
        :on-data-changed="onDataChanged">
    </contour-file-import>
`;
makeAngularModule(moduleName, template, propList);
/*
const bindings = {};
propList.forEach(propKey => bindings[propKey] = '<');

angular
    .module(moduleName, [vueContainer])
    .component(moduleName, {
        template: `
            <vue-container vue-data='ngVue.vueData' vue-methods='ngVue.vueMethods'>
                <contour-file-import
                    ng-non-bindable
                    :on-data-changed="onDataChanged">
                </contour-file-import>
            </vue-container>
        `,
        controller: Controller,
        controllerAs: 'ngVue',
        bindings
    })

function Controller($scope) {
    this.vueData = {};
    this.vueMethods = {};
    this.$onInit = function() {
        propList.forEach(propKey => {
            this.vueData[propKey] = this[propKey];
        })
    }
}
*/
