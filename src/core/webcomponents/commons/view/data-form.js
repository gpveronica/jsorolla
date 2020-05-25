/*
 * Copyright 2015-2016 OpenCB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {html, LitElement} from "/web_modules/lit-element.js";
import UtilsNew from "../../../utilsNew.js";
import "../../simple-plot.js";
import "../../json-viewer.js";
import "../../download-button.js";

export default class DataForm extends LitElement {

    constructor() {
        super();

        this._init();
    }

    createRenderRoot() {
        return this;
    }

    static get properties() {
        return {
            data: {
                type: Object
            },
            config: {
                type: Object
            }
        };
    }

    _init() {
        this._prefix = "dc-" + UtilsNew.randomString(6);
    }

    firstUpdated(_changedProperties) {

        $("#" + this._prefix + "DuePickerDate").datetimepicker({
            format: "DD/MM/YYYY"
        });
        $("#" + this._prefix + "DuePickerDate").on("dp.change", (e) => {
            // $('#datetimepicker7').data("DateTimePicker").minDate(e.date);
            if (e.oldDate) {
                let timeStamp = e.timeStamp;
                this.onFilterChange(e.currentTarget.dataset.field, timeStamp)
            }
        });
    }

    updated(changedProperties) {
        if (changedProperties.has("data")) {
            this.requestUpdate();
        }
    }

    getValue(field, object, defaultValue, format) {
        let value = null;
        if (field) {
            let _object = object ? object : this.data;
            // optional chaining is needed when "res" is undefined
            value = field.split(".").reduce((res, prop) => res?.[prop], _object);

            // needed for handling falsy values
            if (value !== undefined) {
                if (format) {
                    if (format.style) {
                        value = html`<span style="${format.style}">${value}</span>`;
                    }
                    if (format.link) {
                        value = html`<a href="${format.link.replace(field.toUpperCase(), value)}" target="_blank">${value}</a>`;
                    }
                }
            } else {
                value = defaultValue;
            }
        }
        return value;
    }

    applyTemplate(template, object, matches, defaultValue) {
        if (!matches) {
            matches = template.match(/\$\{[a-zA-Z_.\[\]]+\}/g).map(elem => elem.substring(2, elem.length - 1));
        }
        for (let match of matches) {
            let v = this.getValue(match, object, defaultValue);
            template = template.replace("${" + match + "}", v);
        }

        return template;
    }

    _getDefaultValue(element) {
        if (typeof element.defaultValue !== "undefined" && element.defaultValue !== null) {
            return element.defaultValue;
        } else {
            if (this.config.display && this.config.display.defaultValue) {
                return this.config.display.defaultValue;
            } else {
                return "-";
            }
        }
    }

    _getErrorMessage(element) {
        let errorMessage;
        if (element.display && element.display.errorMessage) {
            errorMessage = element.display.errorMessage;
        } else {
            if (this.config?.display?.errorMessage) {
                errorMessage = this.config.display.errorMessage;
            } else {
                errorMessage = "Error: not valid data found";
            }
        }
        return html`<div style="padding-left: 20px"><em>${errorMessage}</em></div>`;
    }
    /**
     * Check if visible field is defined and not null, be careful since 'visible' can be a 'boolean' or a 'function'.
     * @param visible Filed from config
     * @param defaultValue
     * @returns {boolean} Default value is 'true' so it is visible.
     * @private
     */
    _getBooleanValue(visible, defaultValue) {
        let _visible = typeof defaultValue !== "undefined" ? defaultValue : true;
        if (typeof visible !== "undefined" && visible !== null) {
            if (typeof visible === "boolean") {
                _visible = visible;
            } else {
                if (typeof visible === "function") {
                    _visible = visible(this.data);
                } else {
                    console.error(`Field 'visible' not boolean or function: ${typeof visible}`)
                }
            }
        }
        return _visible;
    }

    _getWidth(element) {
        if (element.display && element.display.width) {
            return element.display.width;
        } else {
            if (this.config.display && this.config.display.defaultWidth) {
                return this.config.display.defaultWidth;
            } else {
                return "3";
            }
        }
    }

    _createSection(section) {
        // Check if the section is visible
        if (section.display && !this._getBooleanValue(section.display.visible)){
            return;
        }

        // Get some default values
        let sectionTitleStyle = (section.display && section.display.style)
            ? section.display.style
            : "padding: 5px 0px; width: 80%; border-bottom: 1px solid #ddd";

        let content;
        // Section 'elements' array has just one dimension
        if (!Array.isArray(section.elements[0])) {
            content = html`
                <section style="margin-top: 20px">
                    <h3 style="${sectionTitleStyle}">${section.title}</h3>
                    <div class="container-fluid">
                        ${section.elements.map(element => this._createElement(element))}
                    </div>
                </section>
            `;
        } else {    // Field 'elements' array has two dimensions
            let leftColumnWidth = section?.display?.leftColumnWith ? section.display.leftColumnWith : 6;
            let rightColumnWidth = 12 - leftColumnWidth;
            let columnSeparatorStyle = (section.display && section.display.columnSeparatorStyle) ? section.display.columnSeparatorStyle : "";
            content = html`
                <section style="margin-top: 20px">
                    <h3 style="${sectionTitleStyle}">${section.title}</h3>
                    <div class="container-fluid">
                        <div class="row detail-row">
                            <div class="col-md-${leftColumnWidth}" style="${columnSeparatorStyle}">
                                ${section.elements[0].map(element => this._createElement(element))}
                            </div>
                            <div class="col-md-${rightColumnWidth}">
                                ${section.elements[1].map(element => this._createElement(element))}
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        return content;
    }

    _createElement(element) {
        // Check if the element is visible
        if (element.display && !this._getBooleanValue(element.display.visible)){
            return;
        }

        // Check if type is 'separator', this is a special case, no need to parse 'name' and 'content'
        if (element.type === "separator") {
            return html`
                <div>
                    <hr style="${element.display.style}">
                </div>
            `;
        }

        // Templates are allowed in the titles
        let title = element.name;
        if (title && title.includes("${")) {
            title = this.applyTemplate(element.name);
        }

        let content = "";
        // if not 'type' is defined we assumed is 'basic' and therefore field exist
        if (!element.type || element.type === "basic") {
            content = html`${this.getValue(element.field, this.data, this._getDefaultValue(element), element.display ? element.display.format : null)}`;
        } else {
            // Other 'type' are rendered by specific functions
            switch (element.type) {
                case "input-text":
                    content = this._createInputTextElement(element);
                    break;
                case "input-number":
                    content = this._createInputNumberElement(element);
                    break;
                case "input-date":
                    content = this._createInputDateElement(element);
                    break;
                case "select":
                    content = this._createInputSelectElement(element);
                    break;
                case "complex":
                    content = this._createComplexElement(element);
                    break;
                case "list":
                    content = this._createListElement(element);
                    break;
                case "table":
                    content = this._createTableElement(element);
                    break;
                case "plot":
                    content = this._createPlotElement(element);
                    break;
                case "json":
                    content = this._createJsonElement(element);
                    break;
                case "custom":
                    content = this._createCustomElement(element);
                    break;
                case "download":
                    content = this._createDownloadElement(element);
                    break;
                default:
                    throw new Error("Element type not supported:" + element.type);
            }
        }

        let layout = (element.display && element.display.layout) ? element.display.layout : this.config?.display?.defaultLayout || "vertical";
        let labelWidth = this.config.display && this.config.display.labelWidth ? this.config.display.labelWidth : 2;
        if (layout === "horizontal") {
            // Label 'width' and 'align' are configured by 'labelWidth' and 'labelAlign', defaults are '2' and 'left' respectively
            return html`
                <div class="row detail-row">
                    <div class="col-md-12">
                        <div class="col-md-${labelWidth} text-${this.config.display?.labelAlign || "left"}">
                            <label>${title}</label>
                        </div>
                        <div class="col-md-${12 - labelWidth}">
                            ${content}
                        </div>
                    </div>
                </div>        
            `;
        } else {
            return html`
                <div class="row detail-row">
                    <div class="col-md-12">
                        <label>${title}</label>
                    </div>
                    <div class="col-md-12">
                        ${content}
                    </div>
                </div>        
            `;
        }
    }

    _createInputTextElement(element) {
        let value = this.getValue(element.field) || this._getDefaultValue(element);
        let disabled = this._getBooleanValue(element.display.disabled, false);
        let width = this._getWidth(element);
        let rows = element.display.rows ? element.display.rows : 1;

        return html`
            <div class="col-md-${width}">
                <text-field-filter placeholder="${element.display?.placeholder}" .rows=${rows} ?disabled=${disabled} ?required=${element.required} 
                                    .value="${value}" @filterChange="${e => this.onFilterChange(element.field, e.detail.value)}">
                </text-field-filter>
            </div>
        `;
    }

    _createInputNumberElement(element) {
        let value = this.getValue(element.field) || this._getDefaultValue(element);
        let disabled = this._getBooleanValue(element.display.disabled, false);
        let width = this._getWidth(element);
        const [min = "", max = ""] = element.allowedValues || [];

        return html`
            <div class="col-md-${width}">
                <input type="number" min=${min} max=${max} step="0.01" placeholder="${element.display.placeholder || ""}" ?disabled=${disabled} ?required=${element.required} class="form-control input-sm"
                        value="${value || ""}" @input="${e => this.onFilterChange(element.field, e.target.value)}">
            </div>
        `;
    }

    _createInputDateElement(element) {
        let value = this.getValue(element.field) || this._getDefaultValue(element);
        if (typeof value !== "undefined" && value !== null) {
            let date = this.querySelector("#" + this._prefix + "DueDate");
            if (date) {
                date.value = value;
            }
        }
        let disabled = this._getBooleanValue(element.display.disabled, false);
        let width = this._getWidth(element);

        return html`
            <div class="date col-md-${width}">
                <div class='form-group input-group date' id="${this._prefix}DuePickerDate" data-field="${element.field}">
                    <input type='text' id="${this._prefix}DueDate" class="${this._prefix}Input form-control" data-field="${element.field}" ?disabled="${disabled}">
                    <span class="input-group-addon">
                        <span class="fa fa-calendar"></span>
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Creates a select element given some values. You can provide:
     * i) 'allowedValues' is an array, optionally 'defaultValue' and 'display.apply'.
     * ii) 'allowedValues' is a string pointing to a data field
     * ii) 'allowedValues' function returning {allowedValues: [...], defaultValue: "..."}
     * @param element
     * @returns {*|TemplateResult}
     * @private
     */
    _createInputSelectElement(element) {
        let allowedValues = [];
        let defaultValue = null;

        // First. Check if 'allowedValues' field is provided
        if (element.allowedValues) {
            if (Array.isArray(element.allowedValues)) {
                allowedValues = element.allowedValues;
            } else {
                if (typeof element.allowedValues === "string") {
                    let values = this.getValue(element.allowedValues);
                    if (values && element.display.apply) {
                        for (let value of values) {
                            allowedValues.push(element.display.apply(value));
                        }
                    } else {
                        allowedValues = values;
                    }
                } else {
                    if (typeof element.allowedValues === "function") {
                        let values = element.allowedValues(this.data);
                        if (values) {
                            allowedValues = values.allowedValues;
                            if (values.defaultValue) {
                                defaultValue = values.defaultValue;
                            } else {
                                // Select defaultValue when only one value exist
                                if (allowedValues && allowedValues.length === 1) {
                                    defaultValue = allowedValues[0];
                                }
                            }
                        }
                    } else {
                        console.error("element.allowedValues must be an array, string or function")
                    }
                }
            }

            // Check if data field contains a value
            defaultValue = this.getValue(element.field);
            if (defaultValue) {
                // If apply is define we need to apply the same transformation to be selected
                if (element.display.apply) {
                    for (let allowedValue of allowedValues) {
                        if (allowedValue.includes(defaultValue)) {
                            defaultValue = allowedValue;
                            break;
                        }
                    }
                }
            } else {
                // Check if a defaultValue is set in element config
                if (element.defaultValue) {
                    defaultValue = element.defaultValue;
                } else {
                    // Select defaultValue when only one value exist
                    if (allowedValues && allowedValues.length === 1) {
                        defaultValue = allowedValues[0];
                    }
                }
            }
        }

        // Default values
        let disabled = this._getBooleanValue(element.display.disabled, false);
        let width = this._getWidth(element);
        if (allowedValues && allowedValues.length > 0) {
            return html`
                <div class="col-md-${width}">
                    <select-field-filter .data="${allowedValues}" ?multiple="${element.multiple}" ?disabled=${disabled} ?required=${element.required} 
                                            .value="${defaultValue}" maxOptions="1"  @filterChange="${e => this.onFilterChange(element.field, e.detail.value)}">
                    </select-field-filter>
                </div>
            `;
        } else {
            return this._getErrorMessage(element);
        }
    }

    _createComplexElement(element) {
        if (!element.display || !element.display.template) {
            return html`<span style="color: red">No template provided</span>`;
        }
        return html`<span>${this.applyTemplate(element.display.template, this.data, null, this._getDefaultValue(element))}</span>`;
    }

    _createListElement(element) {
        // Get values
        let array = this.getValue(element.field);
        let contentLayout = (element.display && element.display.contentLayout) ? element.display.contentLayout : "horizontal";

        // Check values
        if (!array || !array.length) {
            return html`<span style="color: red">${this._getDefaultValue(element)}</span>`;
        }
        if (!Array.isArray(array)) {
            return html`<span style="color: red">Field '${element.field}' is not an array</span>`;
        }
        // if (!array.length) {
        //     // return this.getDefaultValue(element);
        //     return html`<span>${this.getDefaultValue(element)}'</span>`;
        // }
        if (contentLayout !== "horizontal" && contentLayout !== "vertical" && contentLayout !== "bullets") {
            return html`<span style="color: red">Content layout must be 'horizontal', 'vertical' or 'bullets'</span>`;
        }

        // Apply the template to all Array elements and store them in 'values'
        let values = [];
        if (element.display.render) {
            for (let object of array) {
                let value = element.display.render(object);
                values.push(value);
            }
        } else {
            if (element.display.template) {
                let matches = element.display.template.match(/\$\{[a-zA-Z_.\[\]]+\}/g).map(elem => elem.substring(2, elem.length - 1));
                for (let object of array) {
                    let value = this.applyTemplate(element.display.template, object, matches, this._getDefaultValue(element));
                    values.push(value);
                }
            } else {
                // if 'display.template' does not exist means it is an array of scalars
                values = array;
            }
        }

        // Render element values
        let content = "-";
        switch (contentLayout) {
            case "horizontal":
                let separator = (element.display && element.display.separator) ? element.display.separator : ", ";
                content = html`${values.join(separator)}`;
                break;
            case "vertical":
                content = html`
                    ${values.map(elem => html`
                        <div>${elem}</div>
                    `)}
                `;
                break;
            case "bullets":
                content = html`
                    <ul style="padding-left: 20px">
                        ${values.map(elem => html`
                            <li>${elem}</li>
                        `)}
                    </ul>
                `;
                break;
        }
        return content;
    }

    _createTableElement(element) {
        // Get values
        let array = this.getValue(element.field);

        // Check values
        if (!array) {
            return html`<span class="text-danger">Type 'table' requires a valid array field: '${element.field}' not found</span>`;
        }
        if (!Array.isArray(array)) {
            return html`<span class="text-danger">Field '${element.field}' is not an array</span>`;
        }
        if (!array.length) {
            // return this.getDefaultValue(element);
            return html`<span>${this._getDefaultValue(element)}</span>`;
        }
        if (!element.display && !element.display.columns) {
            return html`<span class="text-danger">Type 'table' requires a 'columns' array</span>`;
        }

        return html`
            <table class="table" style="display: inline">
                <thead>
                    <tr>
                        ${element.display.columns.map(elem => html`
                            <th scope="col">${elem.name}</th>
                        `)}
                    </tr>
                </thead>
                <tbody>
                    ${array.map(row => html`
                        <tr scope="row">
                            ${element.display.columns.map(elem => html`
                                <td>
                                    ${elem.display && elem.display.render 
                                        ? elem.display.render(this.getValue(elem.field, row)) 
                                        : this.getValue(elem.field, row, elem.defaultValue, elem.format)
                                    }
                                </td>
                            `)}
                        </tr>
                    `)}
                 </tbody>
            </table>
        `;
    }

    _createPlotElement(element) {
        // By default we use data object in the element
        let data = element.data;

        // If a valid field object or arrays is defined we use it
        let value = this.getValue(element.field);
        if (value) {
            if (Array.isArray(value)) {
                let _data = {};
                for (let val of value) {
                    let k = val[element.display.data.key];
                    let v = val[element.display.data.value];
                    _data[k] = v;
                }
                data = _data;
            } else {
                if (typeof value === "object") {
                    data = value;
                }
            }
        }
        if (data) {
            return html`<simple-plot .active="${true}" type="${element.display.chart}" title="${element.name}" .data="${data}"></simple-plot>`;
        } else {
            return this._getErrorMessage(element);
        }
    }

    _createJsonElement(element) {
        const json = this.getValue(element.field, this.data, this._getDefaultValue(element));
        if (json.length || UtilsNew.isObject(json)) {
            return html`<json-viewer .data="${json}" />`;
        } else {
            return this._getDefaultValue(element);
        }
    }

    _createCustomElement(element) {
        if (!element.display && !element.display.render) {
            return "All 'custom' elements must implement a 'display.render' function.";
        }

        // If 'field' is defined then we pass it to the 'render' function, otherwise 'data' object is passed
        let data = this.data;
        // if (element.field) {
        //     data = this.getValue(element.field);
        // }

        // Call to render function if defined
        // It covers the case the result of this.getValue is actually undefined
        let result = element.display.render(data);
        if (result) {
            let width = this._getWidth(element);
            return html`<div class="col-md-${width}">${result}</div>`;
            // return data ? h : this.getDefaultValue(element);
        } else {
            return this._getErrorMessage(element);
        }
    }

    _createDownloadElement(element) {
        return html`<download-button .json="${this.data}" name="${element.name}"></download-button>`
    }

    postRender() {
        // init any jquery plugin we might have used
        //$('.json-renderer').jsonViewer(data);
    }


    onFilterChange(field, value) {
        this.dispatchEvent(new CustomEvent("fieldChange", {
            detail: {
                param: field,
                value: value
            },
            bubbles: true,
            composed: true
        }));
    }

    onClear(e) {
        this.dispatchEvent(new CustomEvent("clear", {
            detail: {
            },
            bubbles: true,
            composed: true
        }));
    }

    onRun(e) {
        this.dispatchEvent(new CustomEvent("run", {
            detail: {
            },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        // Check Project exists
        if (!this.data) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-lock fa-5x"></i>
                    <h3>No valid data provided: ${this.data}</h3>
                </div>
            `;
        }

        // Check configuration
        if (!this.config) {
            return html`
                <div class="guard-page">
                    <i class="fas fa-exclamation fa-5x"></i>
                    <h3>No valid configuration provided. Please check configuration:</h3>
                    <div style="padding: 10px">
                        <pre>${JSON.stringify(this.config, null, 2)}</pre>              
                    </div>
                </div>
            `;
        }

        return html`
            <!-- Header -->
            ${this.config.title && this.config.display && this.config.display.showTitle 
                ? html`
                    <div>
                        <h2>${this.config.title}</h2>
                    </div>`
                : null
            }
            
            <div class="row">
                <div class="col-md-12">
                    ${this.config.sections.map(section => this._createSection(section))}
                </div>
                ${this.config.display && this.config.display.buttons && this.config.display.buttons.show
                    ? html`
                        <div class="col-md-12" style="padding: 20px 40px">
                            <button type="button" class="btn btn-primary btn-lg" @click="${this.onClear}">Clear</button>
                            <button type="button" class="btn btn-primary btn-lg" @click="${this.onRun}">Run</button>
                        </div>`
                    : null
                }
            </div>
        `;
    }
}

customElements.define("data-form", DataForm);
